
import type { CaseStatus } from '~/modules/case/types/case'

export interface IDragDropOptions {
onStatusUpdate: (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus) => Promise<boolean>;
}
