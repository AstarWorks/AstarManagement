# JUnit5 Nested Class Issue

## Problem
When using `@TestInstance(PER_CLASS)` with `@Nested` inner classes in JUnit 5, there are limitations:
1. @BeforeAll in inner classes cannot be non-static unless the inner class also has @TestInstance(PER_CLASS)
2. Instance variables from outer class cannot be directly shared with inner classes
3. Inner classes are treated as separate test instances

## Solution
Options:
1. Remove @Nested and use flat test structure with proper @Order annotations
2. Use @TestInstance(PER_CLASS) on each @Nested class
3. Use companion object for shared state

## Current Implementation Status
- Attempted to use @BeforeAll in inner classes but got initializationError
- Need to either flatten structure or add @TestInstance to each nested class