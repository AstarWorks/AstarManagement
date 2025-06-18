FROM grafana/k6:latest

# Set working directory
WORKDIR /performance-tests

# Copy package.json for documentation
COPY package.json ./

# Copy test configuration and utilities
COPY config/ ./config/
COPY utils/ ./utils/
COPY tests/ ./tests/

# Create output directory for test results
RUN mkdir -p /performance-tests/results

# Default command runs baseline tests
CMD ["run", "/performance-tests/tests/baseline.js"]