package com.astarworks.astarmanagement

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories

@SpringBootApplication
@EnableJdbcRepositories
class AstarManagementApplication

fun main(args: Array<String>) {
    runApplication<AstarManagementApplication>(*args)
}
