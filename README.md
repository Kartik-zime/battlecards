# Competitor Insights Dashboard

A React-based dashboard for visualizing and analyzing competitor insights from sales calls and deals. The application provides interactive charts and filterable tables to help understand competitor positioning, deal stages, and feature comparisons.

## Features

- **Interactive Charts**: Visualize competitor data through pie charts for:
  - Product Status
  - Nature of Comparison
  - Deal Stages
  - Features Discussed

- **Competitor Analysis**:
  - Track total, open, and closed deals
  - Monitor win/loss ratios
  - Compare competitor performance

- **Advanced Filtering**:
  - Multi-column filtering
  - Date range selection
  - Dynamic chart filtering

- **Responsive Table**:
  - Sortable columns
  - Link to call recordings
  - Detailed insight viewing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd competitor-insights
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view the application

### Environment Variables

Create a `.env` file in the root directory with the following variables:
```
VITE_API_URL=your_api_url_here
```

## Built With

- React
- TypeScript
- Chart.js
- Tailwind CSS
- Lucide Icons

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details 