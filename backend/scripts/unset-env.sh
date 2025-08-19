#!/bin/bash

# Unset Spring profile environment variable to use application.yml defaults
echo "Unsetting SPRING_PROFILES_ACTIVE environment variable..."
unset SPRING_PROFILES_ACTIVE
export -n SPRING_PROFILES_ACTIVE

echo "✅ Environment variable cleared"
echo "Application will now use default profile from application.yml (local)"
echo ""
echo "Please restart your Spring Boot application for changes to take effect."