# Requirement: R10 - Revenue Management

## Overview
Implement a comprehensive revenue management dashboard that provides visual analytics for financial performance across matters, lawyers, and the entire office. The system must support interactive charts, flexible time period comparisons, and detailed KPI tracking for data-driven business decisions.

## Detailed Requirements

### 1. Dashboard Structure

#### 1.1 View Modes
- **Office-wide**: Aggregate view of entire firm
- **By Lawyer**: Individual lawyer performance
- **By Matter**: Revenue breakdown per case

#### 1.2 URL Structure
```
/revenue                                    # Default office-wide view
/revenue?view=lawyer&id=:lawyerId          # Lawyer-specific view
/revenue?view=matter&id=:matterId          # Matter-specific view
/revenue?period=month&compare=prev-month    # Period comparisons
/revenue?from=2024-01-01&to=2024-12-31    # Custom date ranges
```

### 2. Key Performance Indicators (KPIs)

#### 2.1 Primary Metrics
```typescript
interface RevenueMetrics {
  revenue: {
    total: number
    breakdown: {
      retainer: number      // 着手金
      success: number       // 成功報酬
      timeCharge: number    // タイムチャージ
    }
  }
  profitRate: number        // 利益率 (%)
  collectionRate: number    // 回収率 (%)
  matterCount: number       // 件数
}
```

#### 2.2 KPI Display Cards
```
┌─────────────────┬─────────────────┬─────────────────┬──────────┐
│ Revenue         │ Profit Rate     │ Collection Rate │ Cases    │
│ ¥12,500,000    │ 42.5%          │ 87.3%          │ 23       │
│ ▲15.2%         │ ▲2.3pt         │ ▼1.2pt         │ ▲3       │
└─────────────────┴─────────────────┴─────────────────┴──────────┘
```

### 3. Time Period Management

#### 3.1 Preset Periods
- This Month / Last Month
- This Quarter / Last Quarter  
- This Year / Last Year
- Custom date range

#### 3.2 Comparison Options
- Previous period (same duration)
- Same period last year
- 3-year average
- Custom comparison period

### 4. Chart Visualizations

#### 4.1 Chart Types
- **Bar Chart**: Monthly revenue breakdown
- **Line Chart**: Trend analysis over time
- **Pie Chart**: Revenue composition
- **Combined Chart**: Multiple metrics overlay

#### 4.2 Interactive Features
- Hover for detailed tooltips
- Click to drill down
- Zoom and pan
- Export chart as image
- Full-screen view

### 5. Filtering System

#### 5.1 Revenue Components
```
Filter: ☑Retainer ☑Success Fee ☑Time Charge ☐Expenses
```
Note: Expenses excluded from revenue by default

#### 5.2 Additional Filters
- Matter type (Civil/Criminal/Family/Corporate)
- Lawyer selection (multiple)
- Client category
- Payment status

### 6. Revenue Recognition Rules

#### 6.1 Timing
- Revenue recorded when matter closes
- Accrual-based accounting
- Manual adjustments supported

#### 6.2 Components
- **Included**: Retainer fees, success fees, time charges
- **Excluded**: Expenses, disbursements
- **Configurable**: Additional revenue types

### 7. Data Export

#### 7.1 Export Formats

**PDF Report**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Revenue Management Report
           January 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ Summary
Revenue: ¥12,500,000 (MoM +15.2%)
Profit Rate: 42.5% (MoM +2.3pt)
Collection Rate: 87.3% (MoM -1.2pt)

■ Revenue Breakdown
- Retainer: ¥5,000,000 (40.0%)
- Success Fee: ¥6,000,000 (48.0%)
- Time Charge: ¥1,500,000 (12.0%)
```

**CSV Export**:
```csv
Period,Total Revenue,Retainer,Success Fee,Time Charge,Profit Rate,Collection Rate,Cases
2025-01,12500000,5000000,6000000,1500000,42.5,87.3,23
2024-12,10850000,4500000,5000000,1350000,40.2,88.5,20
```

### 8. Performance Analytics

#### 8.1 Trend Analysis
- Revenue growth rate
- Seasonal patterns
- Matter type profitability
- Lawyer efficiency metrics

#### 8.2 Comparative Analysis
- Benchmark against targets
- Year-over-year growth
- Department comparisons
- Industry benchmarks

### 9. Future AI Features (MVP: Buttons Only)

#### 9.1 Planned Capabilities
- **AI Analysis**: Automated insights generation
- **Revenue Forecast**: Predictive modeling
- **Anomaly Detection**: Unusual pattern alerts
- **Trend Analysis**: Advanced pattern recognition

#### 9.2 MVP Implementation
- Display buttons for future features
- Show "Coming Soon" on click
- Track feature interest via analytics

### 10. Permissions and Security

#### 10.1 Access Control (Post-MVP)
- Lawyers see all data (MVP default)
- Future: Role-based restrictions
- Audit trail for data access
- Export permissions

#### 10.2 Data Security
- Encrypted data transmission
- Secure calculation methods
- No client-specific data exposure
- Anonymization options

### 11. Performance Requirements

- Dashboard load: < 2 seconds
- Chart rendering: < 500ms
- Filter application: < 300ms
- Export generation: < 5 seconds
- Real-time updates: Not required

### 12. Chart Library Requirements

#### 12.1 Technical Specifications
- Vue 3 compatible
- Responsive design
- Touch-friendly
- High DPI support
- Accessibility compliant

#### 12.2 Library Options
- Chart.js with vue-chartjs
- Apache ECharts
- D3.js for custom visualizations

## Implementation Notes

1. Use computed properties for KPI calculations
2. Implement data caching for performance
3. Lazy load chart libraries
4. Use Web Workers for heavy calculations
5. Implement progressive data loading
6. Add loading skeletons for perceived performance

## Testing Requirements

- Test with 5 years of historical data
- Verify calculation accuracy
- Test all chart interactions
- Verify export data integrity
- Test responsive design on all devices
- Performance test with large datasets
- Verify filter combinations
- Test period comparison logic