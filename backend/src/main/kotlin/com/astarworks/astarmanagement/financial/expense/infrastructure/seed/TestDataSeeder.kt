package com.astarworks.astarmanagement.modules.financial.expense.infrastructure.seed

import com.astarworks.astarmanagement.modules.shared.domain.repository.UserRepository
import com.astarworks.astarmanagement.modules.financial.expense.domain.model.*
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.AttachmentRepository
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.ExpenseRepository
import com.astarworks.astarmanagement.modules.financial.expense.domain.repository.TagRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.CommandLineRunner
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.Instant
import java.util.UUID
import kotlin.random.Random

/**
 * Test data seeder for realistic legal firm expense management scenarios.
 * Creates comprehensive test data across expenses, tags, and attachments for development and testing.
 * 
 * Activates only in development and test environments with proper tenant isolation.
 */
@Component
@Profile("dev")
class TestDataSeeder(
    private val expenseRepository: ExpenseRepository,
    private val tagRepository: TagRepository,
    private val attachmentRepository: AttachmentRepository,
    private val userRepository: UserRepository
) : CommandLineRunner {
    
    private val logger = LoggerFactory.getLogger(TestDataSeeder::class.java)
    
    // Demo tenant configuration from existing migrations
    private val demoTenantId = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-000000000001")
    
    override fun run(vararg args: String?) {
        try {
            logger.info("Starting test data seeding for legal firm expense management...")
            
            if (!shouldSeedData()) {
                logger.info("Test data already exists for demo tenant. Skipping seeding.")
                return
            }
            
            seedTestData()
            
            logger.info("Test data seeding completed successfully!")
        } catch (e: Exception) {
            logger.error("Failed to seed test data", e)
            throw e
        }
    }
    
    /**
     * Checks if test data seeding is needed by verifying if demo tenant has expenses.
     */
    private fun shouldSeedData(): Boolean {
        // Check if demo tenant already has expense data
        val existingExpenses = expenseRepository.findByTenantId(
            demoTenantId,
            org.springframework.data.domain.PageRequest.of(0, 1)
        )
        
        return existingExpenses.isEmpty
    }
    
    /**
     * Seeds all test data in proper order with transactional consistency.
     */
    @Transactional
    fun seedTestData() {
        // Get demo users for audit trails
        val demoUsers = findDemoUsers()
        if (demoUsers.isEmpty()) {
            logger.warn("No demo users found. Creating audit trails with placeholder user.")
        }
        
        val auditUser = demoUsers.firstOrNull()?.id
        
        // Seed data in dependency order
        logger.info("Creating tag data...")
        val tags = createTagData(auditUser)
        
        logger.info("Creating expense data...")
        val expenses = createExpenseData(tags, auditUser)
        
        logger.info("Creating attachment data...")
        createAttachmentData(expenses, auditUser)
        
        logger.info("Test data creation completed. Created ${expenses.size} expenses with ${tags.size} tags.")
    }
    
    /**
     * Finds demo users for audit trail population.
     */
    private fun findDemoUsers(): List<com.astarworks.astarmanagement.modules.shared.domain.entity.User> {
        // For test data seeding, use a fixed demo user ID that matches existing migrations
        // This ensures audit trails are properly populated
        val user = com.astarworks.astarmanagement.modules.shared.domain.entity.User(
            tenantId = demoTenantId,
            username = "testseeder",
            email = "test-seeder@example.com",
            password = "hashed-password",
            firstName = "Test",
            lastName = "Seeder",
            role = com.astarworks.astarmanagement.modules.shared.domain.entity.UserRole.USER,
            isActive = true,
            createdAt = java.time.LocalDateTime.now(),
            updatedAt = java.time.LocalDateTime.now(),
            createdBy = null,
            updatedBy = null,
            lastLoginAt = null
        )
        user.id = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-000000000002") // Demo user ID from migrations
        return listOf(user)
    }
    
    /**
     * Creates comprehensive tag data for Japanese legal practice scenarios.
     */
    private fun createTagData(auditUserId: UUID?): List<Tag> {
        val tags = mutableListOf<Tag>()
        val currentTime = Instant.now()
        
        // Common tenant-wide tags for Japanese legal practice expense categories
        val tenantTags = listOf(
            // Transportation expenses
            TagData("電車代", "#4CAF50", "Train fare"),
            TagData("タクシー代", "#2196F3", "Taxi fare"),
            TagData("駐車場代", "#9C27B0", "Parking fee"),
            TagData("高速道路代", "#FF9800", "Highway toll"),
            
            // Accommodation and travel
            TagData("ホテル代", "#F44336", "Hotel expenses"),
            TagData("出張宿泊費", "#795548", "Business trip accommodation"),
            
            // Meeting and client expenses
            TagData("会議室代", "#3F51B5", "Meeting room rental"),
            TagData("懇親会費", "#E91E63", "Client entertainment"),
            TagData("接待費", "#673AB7", "Business entertainment"),
            
            // Communication expenses
            TagData("電話代", "#00BCD4", "Phone expenses"),
            TagData("郵送料", "#8BC34A", "Postage"),
            TagData("宅配便代", "#FFC107", "Courier services"),
            
            // Office supplies
            TagData("文房具", "#607D8B", "Office supplies"),
            TagData("印刷用紙", "#9E9E9E", "Printing paper"),
            TagData("トナー代", "#FF5722", "Toner cartridges"),
            
            // Professional materials
            TagData("法律書籍", "#1976D2", "Legal books"),
            TagData("判例資料", "#388E3C", "Case law materials"),
            TagData("研修費", "#7B1FA2", "Training fees"),
            
            // Legal fees
            TagData("印紙代", "#D32F2F", "Revenue stamps"),
            TagData("登記手数料", "#303F9F", "Registration fees"),
            TagData("裁判手数料", "#0097A7", "Court fees"),
            
            // Income categories
            TagData("着手金", "#689F38", "Retainer fee"),
            TagData("報酬金", "#1976D2", "Success fee"),
            TagData("相談料", "#7B1FA2", "Consultation fee"),
            
            // General
            TagData("その他実費", "#424242", "Other expenses")
        )
        
        tenantTags.forEach { tagData ->
            val tag = Tag(
                tenantId = demoTenantId,
                name = tagData.name,
                nameNormalized = Tag.normalizeName(tagData.name),
                color = tagData.color,
                scope = TagScope.TENANT,
                ownerId = null,
                usageCount = 0,
                auditInfo = AuditInfo(
                    createdAt = currentTime,
                    updatedAt = currentTime,
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            tags.add(tagRepository.save(tag))
        }
        
        logger.info("Created ${tags.size} tenant-wide tags")
        return tags
    }
    
    /**
     * Creates realistic expense data across multiple categories and time periods.
     */
    private fun createExpenseData(tags: List<Tag>, auditUserId: UUID?): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val random = Random(12345) // Fixed seed for reproducible test data
        
        // Create expenses over the last 6 months
        val endDate = LocalDate.now()
        val startDate = endDate.minusMonths(6)
        
        // Transportation expenses
        expenses.addAll(createTransportationExpenses(tags, startDate, endDate, auditUserId, random))
        
        // Accommodation expenses
        expenses.addAll(createAccommodationExpenses(tags, startDate, endDate, auditUserId, random))
        
        // Office and professional expenses
        expenses.addAll(createOfficeExpenses(tags, startDate, endDate, auditUserId, random))
        
        // Legal fees and court expenses
        expenses.addAll(createLegalExpenses(tags, startDate, endDate, auditUserId, random))
        
        // Income entries
        expenses.addAll(createIncomeEntries(tags, startDate, endDate, auditUserId, random))
        
        // Calculate running balances
        expenses.sortBy { it.date }
        calculateRunningBalances(expenses)
        
        // Save all expenses
        expenses.forEach { expense ->
            expenseRepository.save(expense)
        }
        
        logger.info("Created ${expenses.size} expense entries")
        return expenses
    }
    
    /**
     * Creates sample attachment metadata for various file types linked to expenses.
     */
    private fun createAttachmentData(expenses: List<Expense>, auditUserId: UUID?) {
        val random = Random(67890) // Fixed seed for reproducible test data
        val currentTime = Instant.now()
        
        // File type templates for realistic legal office attachments
        val fileTemplates = listOf(
            AttachmentTemplate("receipt_001.pdf", "application/pdf", 125_000, "Receipt PDF"),
            AttachmentTemplate("receipt_002.jpg", "image/jpeg", 450_000, "Receipt photo"),
            AttachmentTemplate("receipt_003.png", "image/png", 320_000, "Receipt scan"),
            AttachmentTemplate("invoice_001.pdf", "application/pdf", 180_000, "Invoice PDF"),
            AttachmentTemplate("travel_receipt.jpg", "image/jpeg", 380_000, "Travel receipt"),
            AttachmentTemplate("parking_receipt.png", "image/png", 95_000, "Parking receipt"),
            AttachmentTemplate("hotel_bill.pdf", "application/pdf", 220_000, "Hotel bill"),
            AttachmentTemplate("taxi_receipt.jpg", "image/jpeg", 275_000, "Taxi receipt"),
            AttachmentTemplate("office_supplies.pdf", "application/pdf", 165_000, "Office supplies receipt"),
            AttachmentTemplate("legal_book_receipt.jpg", "image/jpeg", 340_000, "Book purchase receipt"),
            AttachmentTemplate("training_certificate.pdf", "application/pdf", 890_000, "Training certificate"),
            AttachmentTemplate("court_fee_receipt.png", "image/png", 115_000, "Court fee receipt"),
            AttachmentTemplate("stamp_receipt.jpg", "image/jpeg", 195_000, "Revenue stamp receipt"),
            AttachmentTemplate("phone_bill.pdf", "application/pdf", 145_000, "Phone bill"),
            AttachmentTemplate("expense_report.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 85_000, "Expense report")
        )
        
        // Create attachments for a subset of expenses (about 60% will have attachments)
        val expensesWithAttachments = expenses.shuffled(random).take((expenses.size * 0.6).toInt())
        
        expensesWithAttachments.forEach { expense ->
            // Decide how many attachments for this expense (1-3, with 1 being most common)
            val attachmentCount = when (random.nextInt(100)) {
                in 0..69 -> 1  // 70% chance of 1 attachment
                in 70..89 -> 2 // 20% chance of 2 attachments
                else -> 3      // 10% chance of 3 attachments
            }
            
            repeat(attachmentCount) { index ->
                val template = fileTemplates.random(random)
                val fileName = "${UUID.randomUUID()}_${template.fileName}"
                val storagePath = "/uploads/${demoTenantId}/${fileName}"
                
                // Create attachment with realistic metadata
                val attachment = Attachment(
                    tenantId = demoTenantId,
                    fileName = fileName,
                    originalName = template.fileName,
                    fileSize = template.fileSize + random.nextInt(-20000, 20000), // Add some variation
                    mimeType = template.mimeType,
                    storagePath = storagePath,
                    status = AttachmentStatus.LINKED,
                    linkedAt = currentTime,
                    uploadedAt = currentTime.minusSeconds(random.nextInt(3600).toLong()), // Uploaded within last hour
                    uploadedBy = auditUserId ?: UUID.randomUUID()
                )
                
                // Add thumbnail path for images
                if (attachment.isImage()) {
                    attachment.thumbnailPath = "/thumbnails/${demoTenantId}/thumb_${fileName}"
                    attachment.thumbnailSize = (attachment.fileSize * 0.1).toLong() // Rough thumbnail size
                }
                
                val savedAttachment = attachmentRepository.save(attachment)
                
                // Create the expense-attachment relationship
                val expenseAttachment = ExpenseAttachment(
                    expense = expense,
                    attachment = savedAttachment,
                    linkedAt = currentTime,
                    linkedBy = auditUserId ?: UUID.randomUUID(),
                    displayOrder = index,
                    description = template.description
                )
                
                expense.addAttachment(expenseAttachment)
            }
        }
        
        // Create some temporary attachments for testing cleanup scenarios
        repeat(5) {
            val template = fileTemplates.random(random)
            val fileName = "${UUID.randomUUID()}_temp_${template.fileName}"
            val storagePath = "/uploads/${demoTenantId}/temp/${fileName}"
            
            val tempAttachment = Attachment(
                tenantId = demoTenantId,
                fileName = fileName,
                originalName = "temp_${template.fileName}",
                fileSize = template.fileSize,
                mimeType = template.mimeType,
                storagePath = storagePath,
                status = AttachmentStatus.TEMPORARY,
                expiresAt = currentTime.plusSeconds(24 * 3600), // Expires in 24 hours
                uploadedAt = currentTime.minusSeconds(random.nextInt(7200).toLong()), // Uploaded within last 2 hours
                uploadedBy = auditUserId ?: UUID.randomUUID()
            )
            
            attachmentRepository.save(tempAttachment)
        }
        
        // Create one failed attachment for error handling testing
        val failedTemplate = fileTemplates.random(random)
        val failedAttachment = Attachment(
            tenantId = demoTenantId,
            fileName = "${UUID.randomUUID()}_failed_${failedTemplate.fileName}",
            originalName = "failed_${failedTemplate.fileName}",
            fileSize = failedTemplate.fileSize,
            mimeType = failedTemplate.mimeType,
            storagePath = "/uploads/${demoTenantId}/failed/",
            status = AttachmentStatus.FAILED,
            uploadedAt = currentTime.minusSeconds(3600),
            uploadedBy = auditUserId ?: UUID.randomUUID()
        )
        
        attachmentRepository.save(failedAttachment)
        
        logger.info("Created attachments for ${expensesWithAttachments.size} expenses with various file types and statuses")
    }
    
    /**
     * Template for creating realistic attachment metadata.
     */
    private data class AttachmentTemplate(
        val fileName: String,
        val mimeType: String,
        val fileSize: Long,
        val description: String
    )
    
    /**
     * Creates realistic transportation expenses for legal practice.
     */
    private fun createTransportationExpenses(tags: List<Tag>, startDate: LocalDate, endDate: LocalDate, auditUserId: UUID?, random: Random): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val transportTags = tags.filter { it.name in listOf("電車代", "タクシー代", "駐車場代", "高速道路代") }
        
        // Create 20-30 transportation expenses
        repeat(25) {
            val date = randomDateBetween(startDate, endDate, random)
            val tag = transportTags.random(random)
            val (amount, description) = when (tag.name) {
                "電車代" -> Pair(
                    BigDecimal(random.nextInt(200, 1500)),
                    listOf("裁判所まで往復", "クライアント面談のため", "法務局まで", "検察庁まで往復").random(random)
                )
                "タクシー代" -> Pair(
                    BigDecimal(random.nextInt(800, 3500)),
                    listOf("急用で裁判所へ", "夜間クライアント対応", "書類配達のため", "証人面談のため").random(random)
                )
                "駐車場代" -> Pair(
                    BigDecimal(random.nextInt(300, 1200)),
                    listOf("裁判所駐車場", "法務局駐車場", "クライアント事務所", "検察庁駐車場").random(random)
                )
                "高速道路代" -> Pair(
                    BigDecimal(random.nextInt(1000, 5000)),
                    listOf("地方裁判所出張", "遠方クライアント面談", "証拠収集のため出張", "調停参加のため").random(random)
                )
                else -> Pair(BigDecimal(1000), "交通費")
            }
            
            val expense = Expense(
                tenantId = demoTenantId,
                date = date,
                category = "Transportation",
                description = description,
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = amount,
                auditInfo = AuditInfo(
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            expense.addTag(tag)
            expenses.add(expense)
        }
        
        return expenses
    }
    
    /**
     * Creates accommodation and travel-related expenses.
     */
    private fun createAccommodationExpenses(tags: List<Tag>, startDate: LocalDate, endDate: LocalDate, auditUserId: UUID?, random: Random): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val accommodationTags = tags.filter { it.name in listOf("ホテル代", "出張宿泊費") }
        
        // Create 8-12 accommodation expenses (less frequent)
        repeat(10) {
            val date = randomDateBetween(startDate, endDate, random)
            val tag = accommodationTags.random(random)
            val (amount, description) = when (tag.name) {
                "ホテル代" -> Pair(
                    BigDecimal(random.nextInt(8000, 15000)),
                    listOf("地方出張（1泊）", "証人面談のため宿泊", "調停参加のため宿泊", "研修参加のため宿泊").random(random)
                )
                "出張宿泊費" -> Pair(
                    BigDecimal(random.nextInt(12000, 25000)),
                    listOf("地方裁判所出張（2泊）", "長期案件出張", "複数日程の証拠収集", "研修合宿参加").random(random)
                )
                else -> Pair(BigDecimal(10000), "宿泊費")
            }
            
            val expense = Expense(
                tenantId = demoTenantId,
                date = date,
                category = "Accommodation",
                description = description,
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = amount,
                auditInfo = AuditInfo(
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            expense.addTag(tag)
            expenses.add(expense)
        }
        
        return expenses
    }
    
    /**
     * Creates office supplies and professional material expenses.
     */
    private fun createOfficeExpenses(tags: List<Tag>, startDate: LocalDate, endDate: LocalDate, auditUserId: UUID?, random: Random): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val officeTags = tags.filter { it.name in listOf("文房具", "印刷用紙", "トナー代", "法律書籍", "判例資料", "研修費", "電話代", "郵送料", "宅配便代") }
        
        // Create 30-40 office-related expenses
        repeat(35) {
            val date = randomDateBetween(startDate, endDate, random)
            val tag = officeTags.random(random)
            val (amount, description) = when (tag.name) {
                "文房具" -> Pair(
                    BigDecimal(random.nextInt(500, 3000)),
                    listOf("ボールペン・付箋購入", "ファイル・バインダー", "マーカー・蛍光ペン", "事務用品一式").random(random)
                )
                "印刷用紙" -> Pair(
                    BigDecimal(random.nextInt(800, 2500)),
                    listOf("A4コピー用紙", "契約書用上質紙", "封筒用紙", "プリンター用紙").random(random)
                )
                "トナー代" -> Pair(
                    BigDecimal(random.nextInt(5000, 12000)),
                    listOf("レーザープリンタートナー", "複合機トナー交換", "カラープリンタートナー", "予備トナー購入").random(random)
                )
                "法律書籍" -> Pair(
                    BigDecimal(random.nextInt(8000, 25000)),
                    listOf("最新判例集", "法律実務書", "専門書籍", "法改正対応書籍").random(random)
                )
                "判例資料" -> Pair(
                    BigDecimal(random.nextInt(3000, 8000)),
                    listOf("判例データベース", "裁判例検索", "法律文献", "専門資料").random(random)
                )
                "研修費" -> Pair(
                    BigDecimal(random.nextInt(15000, 50000)),
                    listOf("弁護士会研修", "法律実務研修", "専門分野セミナー", "継続教育講座").random(random)
                )
                "電話代" -> Pair(
                    BigDecimal(random.nextInt(2000, 8000)),
                    listOf("事務所電話料金", "携帯電話料金", "長距離通話料", "国際電話料金").random(random)
                )
                "郵送料" -> Pair(
                    BigDecimal(random.nextInt(200, 1500)),
                    listOf("書類郵送", "内容証明郵便", "配達証明", "速達料金").random(random)
                )
                "宅配便代" -> Pair(
                    BigDecimal(random.nextInt(500, 2000)),
                    listOf("契約書配送", "証拠書類送付", "重要書類配達", "資料送付費").random(random)
                )
                else -> Pair(BigDecimal(1000), "事務所経費")
            }
            
            val category = when {
                tag.name in listOf("文房具", "印刷用紙", "トナー代") -> "Office Supplies"
                tag.name in listOf("法律書籍", "判例資料", "研修費") -> "Professional Materials"
                tag.name in listOf("電話代", "郵送料", "宅配便代") -> "Communication"
                else -> "Office Expenses"
            }
            
            val expense = Expense(
                tenantId = demoTenantId,
                date = date,
                category = category,
                description = description,
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = amount,
                auditInfo = AuditInfo(
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            expense.addTag(tag)
            expenses.add(expense)
        }
        
        return expenses
    }
    
    /**
     * Creates legal fees and court-related expenses.
     */
    private fun createLegalExpenses(tags: List<Tag>, startDate: LocalDate, endDate: LocalDate, auditUserId: UUID?, random: Random): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val legalTags = tags.filter { it.name in listOf("印紙代", "登記手数料", "裁判手数料", "会議室代", "懇親会費", "接待費") }
        
        // Create 15-20 legal expenses
        repeat(18) {
            val date = randomDateBetween(startDate, endDate, random)
            val tag = legalTags.random(random)
            val (amount, description) = when (tag.name) {
                "印紙代" -> Pair(
                    BigDecimal(random.nextInt(200, 20000)),
                    listOf("訴状提出印紙", "控訴状印紙", "証拠書類印紙", "申立書印紙").random(random)
                )
                "登記手数料" -> Pair(
                    BigDecimal(random.nextInt(1000, 15000)),
                    listOf("登記事項証明書", "履歴事項証明書", "印鑑証明書", "不動産登記手数料").random(random)
                )
                "裁判手数料" -> Pair(
                    BigDecimal(random.nextInt(5000, 30000)),
                    listOf("訴訟手数料", "調停申立手数料", "執行手数料", "破産申立手数料").random(random)
                )
                "会議室代" -> Pair(
                    BigDecimal(random.nextInt(3000, 10000)),
                    listOf("クライアント会議室", "弁護士会会議室", "調停会議室", "仲裁会議室").random(random)
                )
                "懇親会費" -> Pair(
                    BigDecimal(random.nextInt(5000, 15000)),
                    listOf("クライアント懇親会", "弁護士会懇親会", "業界交流会", "新年会費").random(random)
                )
                "接待費" -> Pair(
                    BigDecimal(random.nextInt(8000, 25000)),
                    listOf("クライアント接待", "関係者会食", "業務関係接待", "顧問先接待").random(random)
                )
                else -> Pair(BigDecimal(5000), "法的費用")
            }
            
            val category = when {
                tag.name in listOf("印紙代", "登記手数料", "裁判手数料") -> "Legal Fees"
                tag.name in listOf("会議室代", "懇親会費", "接待費") -> "Client Relations"
                else -> "Legal Expenses"
            }
            
            val expense = Expense(
                tenantId = demoTenantId,
                date = date,
                category = category,
                description = description,
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = amount,
                auditInfo = AuditInfo(
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            expense.addTag(tag)
            expenses.add(expense)
        }
        
        return expenses
    }
    
    /**
     * Creates income entries (着手金, 報酬金, 相談料) for balance demonstration.
     */
    private fun createIncomeEntries(tags: List<Tag>, startDate: LocalDate, endDate: LocalDate, auditUserId: UUID?, random: Random): List<Expense> {
        val expenses = mutableListOf<Expense>()
        val incomeTags = tags.filter { it.name in listOf("着手金", "報酬金", "相談料") }
        
        // Create 12-15 income entries
        repeat(14) {
            val date = randomDateBetween(startDate, endDate, random)
            val tag = incomeTags.random(random)
            val (amount, description) = when (tag.name) {
                "着手金" -> Pair(
                    BigDecimal(random.nextInt(100000, 500000)),
                    listOf("民事訴訟着手金", "債権回収着手金", "契約書作成着手金", "法律相談着手金").random(random)
                )
                "報酬金" -> Pair(
                    BigDecimal(random.nextInt(150000, 800000)),
                    listOf("勝訴報酬金", "示談成立報酬", "債権回収成功報酬", "契約締結報酬").random(random)
                )
                "相談料" -> Pair(
                    BigDecimal(random.nextInt(10000, 50000)),
                    listOf("法律相談(2時間)", "初回相談料", "継続相談料", "専門相談料").random(random)
                )
                else -> Pair(BigDecimal(50000), "その他収入")
            }
            
            val expense = Expense(
                tenantId = demoTenantId,
                date = date,
                category = "Income",
                description = description,
                incomeAmount = amount,
                expenseAmount = BigDecimal.ZERO,
                auditInfo = AuditInfo(
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    createdBy = auditUserId,
                    updatedBy = auditUserId
                )
            )
            expense.addTag(tag)
            expenses.add(expense)
        }
        
        return expenses
    }
    
    /**
     * Generates a random date between start and end dates.
     */
    private fun randomDateBetween(startDate: LocalDate, endDate: LocalDate, random: Random): LocalDate {
        val daysBetween = startDate.until(endDate).days
        val randomDays = random.nextInt(daysBetween + 1)
        return startDate.plusDays(randomDays.toLong())
    }
    
    private fun calculateRunningBalances(expenses: List<Expense>) {
        var runningBalance = BigDecimal.ZERO
        expenses.forEach { expense ->
            runningBalance = runningBalance.add(expense.calculateNetAmount())
            expense.balance = runningBalance
        }
    }
    
    /**
     * Data class for tag creation.
     */
    private data class TagData(
        val name: String,
        val color: String,
        val description: String
    )
}