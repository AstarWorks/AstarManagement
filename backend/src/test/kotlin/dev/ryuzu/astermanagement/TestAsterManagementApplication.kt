package dev.ryuzu.astermanagement

import org.springframework.boot.fromApplication
import org.springframework.boot.with


fun main(args: Array<String>) {
    fromApplication<AsterManagementApplication>().with(TestcontainersConfiguration::class).run(*args)
}
