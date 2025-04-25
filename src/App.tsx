import React, { useState, useEffect, useMemo } from 'react';
import { LucideUsers, LucideChevronUp, LucideChevronDown, LucideRefreshCw } from 'lucide-react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend,
  type ChartOptions,
  type ChartData as ChartJSData,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ScatterController,
} from 'chart.js';
import { Pie, Scatter } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ScatterController,
);

interface ApiData {
  Competitor_name: string;
  deal_id: string;
  deal_stage: string;
  sales_stage: string;
  heading: string;
  tag: string;
  Nature: string;
  timestamp: string;
  call_link: string;
  company?: string;
  Rep_name: string;
  Rep_handling: string;
  deal_title: string;
  detail: string;
  call_date: string;
}

interface Competitor {
  name: string;
  totalDeals: number;
  closedDeals: number;
  openDeals: number;
  closedWonDeals: number;
  closedLostDeals: number;
  features: { [key: string]: number };
  productStatus: { [key: string]: number };
  nature: { [key: string]: number };
  dealStage: { [key: string]: number };
  insightNature: { [key: string]: number };
}

type SortField = 'name' | 'totalDeals' | 'openDeals' | 'closedDeals';
type SortOrder = 'asc' | 'desc';

type InsightRow = {
  feature: string;
  insight: string;
  repName: string;
  repHandling: string;
  timestamp: string;
  productStatus: string;
  nature: string;
  dealTitle: string;
  dealStage: string;
  callDate: string;
  callLink: string;
};

// Add new types for table sorting and filtering
type InsightSortField = 'feature' | 'insight' | 'repName' | 'repHandling' | 'timestamp' | 'productStatus' | 'nature' | 'dealTitle' | 'dealStage';
type ChartFilter = {
  type: 'feature' | 'dealStage' | 'productStatus' | 'nature' | 'salesStage';
  value: string | null;
};

type FeatureData = {
  adoption: number;
  aiPlaybook: number;
  callRecording: number;
  transcription: number;
  pricingCosting: number;
  coaching: number;
};

type ProductStatusData = {
  evaluating: number;
  rejected: number;
  considering: number;
  doingPilot: number;
};

type InsightNatureData = {
  positiveInsight: number;
  neutralInsight: number;
  objection: number;
};

type DealStageData = {
  closedWon: number;
  closedLost: number;
  ongoing: number;
};

type ChartData = {
  features: FeatureData;
  productStatus: ProductStatusData;
  insightNature: InsightNatureData;
  dealStage: DealStageData;
};

type AggregatedData = {
  productStatus: { [key: string]: number };
  nature: { [key: string]: number };
  dealStage: { [key: string]: number };
  features: { [key: string]: number };
  salesStage: { [key: string]: number };
};

interface ColumnFilter {
  dealTitle: string[];
  dealStage: string[];
  salesStage: string[];
  feature: string[];
  insight: string[];
  repName: string[];
  repHandling: string[];
  productStatus: string[];
  nature: string[];
}

interface ProcessedInsight {
  feature: string;
  insight: string;
  repName: string;
  repHandling: string;
  timestamp: string;
  productStatus: string;
  nature: string;
  dealTitle: string;
  dealStage: string;
  salesStage: string;
  callDate: string;
  callLink: string;
  competitor: string;
}

function App() {
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('totalDeals');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | 'Overall'>('Overall');
  const [tableSortField, setTableSortField] = useState<InsightSortField>('timestamp');
  const [tableSortOrder, setTableSortOrder] = useState<SortOrder>('asc');
  const [activeFilter, setActiveFilter] = useState<ChartFilter>({ type: 'feature', value: null });
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    dealTitle: [],
    dealStage: [],
    salesStage: [],
    feature: [],
    insight: [],
    repName: [],
    repHandling: [],
    productStatus: [],
    nature: [],
  });
  const [processedInsights, setProcessedInsights] = useState<ProcessedInsight[]>([]);
  const [isFeatureLegendExpanded, setIsFeatureLegendExpanded] = useState(false);
  const [isSalesLegendExpanded, setIsSalesLegendExpanded] = useState(false);
  const [selectedSalesStages, setSelectedSalesStages] = useState<string[]>([]);
  const [isSalesStageDropdownOpen, setIsSalesStageDropdownOpen] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbz6z1qUqGyEKh_psloIeBM5HzTk1FWV48kM0y9vva2v6sCrRovWUqi0Bj7-8x6tduQ4/exec');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setApiData(data);
        setProcessedInsights(processApiData(data));
        setCompetitors(processCompetitors(data));
        if (data.length > 0 && data[0].company) {
          setCompanyName(data[0].company);
          setSelectedCompany(data[0].company);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setIsSalesStageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const processApiData = (data: ApiData[]): ProcessedInsight[] => {
    return data.map(item => ({
      feature: item.heading,
      insight: item.detail,
      repName: item.Rep_name,
      repHandling: item.Rep_handling,
      timestamp: item.timestamp,
      productStatus: item.tag,
      nature: item.Nature,
      dealTitle: item.deal_title,
      dealStage: item.deal_stage,
      salesStage: item.sales_stage,
      callDate: item.call_date,
      callLink: item.call_link,
      competitor: item.Competitor_name
    }));
  };

  const processCompetitors = (data: ApiData[]) => {
    const competitorMap = new Map<string, Competitor>();
    
    // First, create competitor objects with empty metrics
    data.forEach(item => {
      if (!item.Competitor_name) return;
      
      if (!competitorMap.has(item.Competitor_name)) {
        competitorMap.set(item.Competitor_name, {
          name: item.Competitor_name,
          totalDeals: 0,
          closedDeals: 0,
          openDeals: 0,
          closedWonDeals: 0,
          closedLostDeals: 0,
          features: {},
          productStatus: {},
          nature: {},
          dealStage: {},
          insightNature: {}
        });
      }
    });

    // Process deal counts for each competitor
    competitorMap.forEach((competitor, competitorName) => {
      // Get all records for this competitor
      const competitorRecords = data.filter(item => item.Competitor_name === competitorName);
      
      // Get distinct deal IDs for this competitor
      const distinctDealIds = new Set(competitorRecords.map(record => record.deal_id));
      competitor.totalDeals = distinctDealIds.size;

      // Get distinct closed deal IDs (Won or Lost)
      const closedDealIds = new Set(
        competitorRecords
          .filter(record => record.deal_stage === "Close - Won" || record.deal_stage === "Close - Lost")
          .map(record => record.deal_id)
      );
      competitor.closedDeals = closedDealIds.size;

      // Get distinct open deal IDs (not Won or Lost)
      const openDealIds = new Set(
        competitorRecords
          .filter(record => record.deal_stage !== "Close - Won" && record.deal_stage !== "Close - Lost")
          .map(record => record.deal_id)
      );
      competitor.openDeals = openDealIds.size;

      // Get distinct closed won deal IDs
      const closedWonDealIds = new Set(
        competitorRecords
          .filter(record => record.deal_stage === "Close - Won")
          .map(record => record.deal_id)
      );
      competitor.closedWonDeals = closedWonDealIds.size;

      // Get distinct closed lost deal IDs
      const closedLostDealIds = new Set(
        competitorRecords
          .filter(record => record.deal_stage === "Close - Lost")
          .map(record => record.deal_id)
      );
      competitor.closedLostDeals = closedLostDealIds.size;

      // Process other metrics (features, status, nature, etc.)
      competitorRecords.forEach(record => {
        // Update feature count
        competitor.features[record.heading] = (competitor.features[record.heading] || 0) + 1;
        
        // Update product status count
        competitor.productStatus[record.tag] = (competitor.productStatus[record.tag] || 0) + 1;
        
        // Update nature count
        competitor.nature[record.Nature] = (competitor.nature[record.Nature] || 0) + 1;
        
        // Update deal stage count
        competitor.dealStage[record.deal_stage] = (competitor.dealStage[record.deal_stage] || 0) + 1;

        // Update insight nature count
        competitor.insightNature[record.Nature] = (competitor.insightNature[record.Nature] || 0) + 1;
      });
    });

    return Array.from(competitorMap.values());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCompetitorClick = (competitor: Competitor) => {
    setSelectedCompetitor(competitor.name);
  };

  const handleInsightSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompetitor(event.target.value);
  };

  const sortCompetitors = (competitors: Competitor[], field: SortField, order: SortOrder) => {
    return [...competitors].sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalDeals':
          comparison = a.totalDeals - b.totalDeals;
          break;
        case 'openDeals':
          comparison = a.openDeals - b.openDeals;
          break;
        case 'closedDeals':
          comparison = a.closedDeals - b.closedDeals;
          break;
        default:
          comparison = 0;
      }
      
      return order === 'asc' ? comparison : -comparison;
    });
  };

  const sortedCompetitors = useMemo(() => {
    // First filter by company
    const filtered = competitors.filter(competitor => {
      const apiItem = apiData.find(api => api.Competitor_name === competitor.name);
      return apiItem?.company === selectedCompany;
    });

    // Then sort the filtered competitors
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalDeals':
          comparison = a.totalDeals - b.totalDeals;
          break;
        case 'openDeals':
          comparison = a.openDeals - b.openDeals;
          break;
        case 'closedDeals':
          comparison = a.closedDeals - b.closedDeals;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [competitors, selectedCompany, apiData, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
  return (
        <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30">
          <LucideChevronUp size={16} />
        </div>
      );
    }
    return sortOrder === 'asc' ? (
      <LucideChevronUp size={16} className="w-4 h-4 ml-1" />
    ) : (
      <LucideChevronDown size={16} className="w-4 h-4 ml-1" />
    );
  };

  const getChartData = (competitors: Competitor[], selectedCompetitor: string | null) => {
    // First filter competitors by selected company
    const relevantCompetitors = competitors.filter(competitor => {
      const apiItem = apiData.find(api => api.Competitor_name === competitor.name);
      return selectedCompany ? apiItem?.company === selectedCompany : true;
    });

    // Then filter by selected competitor if any
    const filteredCompetitors = selectedCompetitor && selectedCompetitor !== 'Overall'
      ? relevantCompetitors.filter(comp => comp.name === selectedCompetitor)
      : relevantCompetitors;

    // Aggregate data across filtered competitors
    const aggregatedData = filteredCompetitors.reduce<AggregatedData>((acc, competitor) => {
      // Get records for this competitor
      let competitorRecords = apiData.filter(item => item.Competitor_name === competitor.name);
      
      // Apply sales stage filter if any are selected
      if (selectedSalesStages.length > 0) {
        competitorRecords = competitorRecords.filter(record => selectedSalesStages.includes(record.sales_stage));
      }

      // Rest of the aggregation logic...
      competitorRecords.forEach(record => {
        // Update product status count
        acc.productStatus[record.tag] = (acc.productStatus[record.tag] || 0) + 1;
        
        // Update nature count
        acc.nature[record.Nature] = (acc.nature[record.Nature] || 0) + 1;
        
        // Update sales stage count
        acc.salesStage[record.sales_stage] = (acc.salesStage[record.sales_stage] || 0) + 1;
        
        // Update features count
        acc.features[record.heading] = (acc.features[record.heading] || 0) + 1;
      });

      return acc;
    }, {
      productStatus: {},
      nature: {},
      dealStage: {},
      features: {},
      salesStage: {}
    });

    // Generate chart data with dynamic labels and values
    return {
      productStatusData: {
        labels: ['Only Heard', 'Evaluating but not in pilot', 'In Pilot', 'Using', 'Rejected', 'NA'],
        datasets: [{
          data: [
            aggregatedData.productStatus['Only Heard'] || 0,
            aggregatedData.productStatus['Evaluating but not in pilot'] || 0,
            aggregatedData.productStatus['In Pilot'] || 0,
            aggregatedData.productStatus['Using'] || 0,
            aggregatedData.productStatus['Rejected'] || 0,
            aggregatedData.productStatus['NA'] || 0
          ],
          backgroundColor: [
            '#45B7D1',  // Only Heard - Sky Blue
            '#4ECDC4',  // Evaluating but not in pilot - Turquoise
            '#FFEEAD',  // In Pilot - Light Yellow
            '#FF6B6B',  // Using - Bright Red
            '#96CEB4',  // Rejected - Sage Green
            '#D4A5A5'   // NA - Dusty Rose
          ]
        }]
      },
      natureData: {
        labels: Object.keys(aggregatedData.nature),
        datasets: [{
          data: Object.values(aggregatedData.nature),
          backgroundColor: Object.keys(aggregatedData.nature).map(key => {
            switch (key) {
              case 'Objection':
                return '#E74C3C';  // Red
              case 'Positive Insight':
                return '#2ECC71';  // Green
              case 'Neutral Insight':
                return '#F1C40F';  // Yellow
              default:
                return '#95A5A6';  // Gray (default for any other categories)
            }
          })
        }]
      },
      dealStageData: {
        labels: Object.keys(aggregatedData.dealStage),
        datasets: [{
          data: Object.values(aggregatedData.dealStage),
          backgroundColor: [
            '#27AE60',  // Forest Green
            '#E74C3C',  // Bright Red
            '#3498DB'   // Bright Blue
          ].slice(0, Object.keys(aggregatedData.dealStage).length)
        }]
      },
      featureData: {
        labels: Object.keys(aggregatedData.features),
        datasets: [{
          data: Object.values(aggregatedData.features),
          backgroundColor: [
            '#9B59B6',  // Purple
            '#E67E22',  // Orange
            '#16A085',  // Dark Turquoise
            '#C0392B',  // Dark Red
            '#2980B9',  // Dark Blue
            '#F1C40F'   // Yellow
          ].slice(0, Object.keys(aggregatedData.features).length)
        }]
      },
      salesStageData: {
        labels: Object.keys(aggregatedData.salesStage),
        datasets: [{
          data: Object.values(aggregatedData.salesStage),
          backgroundColor: [
            '#4CAF50',  // Green
            '#2196F3',  // Blue
            '#FFC107',  // Yellow
            '#9C27B0',  // Purple
            '#FF5722',  // Deep Orange
            '#795548',  // Brown
            '#607D8B',  // Blue Grey
            '#E91E63',  // Pink
            '#00BCD4',  // Cyan
            '#FF9800',  // Orange
            '#8BC34A',  // Light Green
            '#673AB7',  // Deep Purple
            '#CDDC39',  // Lime
            '#009688',  // Teal
            '#F44336',  // Red
          ].slice(0, Object.keys(aggregatedData.salesStage).length)
        }]
      }
    };
  };

  const calculateAverages = (competitors: Competitor[], selectedCompetitor: string | null): ChartData => {
    const features: FeatureData = {
      adoption: 0,
      aiPlaybook: 0,
      callRecording: 0,
      transcription: 0,
      pricingCosting: 0,
      coaching: 0,
    };

    const productStatus: ProductStatusData = {
      evaluating: 0,
      rejected: 0,
      considering: 0,
      doingPilot: 0,
    };

    const insightNature: InsightNatureData = {
      positiveInsight: 0,
      neutralInsight: 0,
      objection: 0,
    };

    const dealStage: DealStageData = {
      closedWon: 0,
      closedLost: 0,
      ongoing: 0,
    };

    const relevantCompetitors = selectedCompetitor
      ? competitors.filter(comp => comp.name === selectedCompetitor)
      : competitors;

    relevantCompetitors.forEach(competitor => {
      // Update features
      Object.entries(competitor.features).forEach(([key, value]) => {
        if (key in features) {
          features[key as keyof FeatureData] += value;
        }
      });

      // Update product status
      Object.entries(competitor.productStatus).forEach(([key, value]) => {
        if (key in productStatus) {
          productStatus[key as keyof ProductStatusData] += value;
        }
      });

      // Update insight nature
      Object.entries(competitor.insightNature).forEach(([key, value]) => {
        if (key in insightNature) {
          insightNature[key as keyof InsightNatureData] += value;
        }
      });

      // Update deal stage
      Object.entries(competitor.dealStage).forEach(([key, value]) => {
        if (key in dealStage) {
          dealStage[key as keyof DealStageData] += value;
        }
      });
    });

    // Calculate averages
    const count = relevantCompetitors.length;
    if (count > 0) {
      Object.keys(features).forEach(key => {
        features[key as keyof FeatureData] /= count;
      });
      Object.keys(productStatus).forEach(key => {
        productStatus[key as keyof ProductStatusData] /= count;
      });
      Object.keys(insightNature).forEach(key => {
        insightNature[key as keyof InsightNatureData] /= count;
      });
      Object.keys(dealStage).forEach(key => {
        dealStage[key as keyof DealStageData] /= count;
      });
    }

    return {
      features,
      productStatus,
      insightNature,
      dealStage,
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
        onClick: () => null, // Disable default legend click behavior
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            const dataset = context.dataset;
            const total = dataset.data.reduce((acc: number, data: number) => acc + data, 0);
            const value = dataset.data[context.dataIndex];
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          }
        }
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    onClick: function(event: any, elements: any[], chart: any) {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        const chartType = chart.canvas.id.split('-')[0] as ChartFilter['type'];
        
        let filterValue: string | null = null;
        
        switch (chartType) {
          case 'feature':
            filterValue = chartData?.featureData.labels[clickedIndex] || null;
            break;
          case 'dealStage':
            filterValue = chartData?.dealStageData.labels[clickedIndex] || null;
            break;
          case 'productStatus':
            filterValue = chartData?.productStatusData.labels[clickedIndex] || null;
            break;
          case 'nature':
            filterValue = chartData?.natureData.labels[clickedIndex] || null;
            break;
          default:
            return;
        }

        if (filterValue) {
          setActiveFilter(prev => 
            prev.type === chartType && prev.value === filterValue
              ? { type: chartType, value: null }
              : { type: chartType, value: filterValue }
          );
        }
      }
    },
  };

  const chartData = getChartData(competitors, selectedCompetitor);

  // Sort the filtered insights
  const sortedInsights = [...processedInsights].sort((a, b) => {
    const multiplier = tableSortOrder === 'asc' ? 1 : -1;
    
    // Handle timestamp field separately since it needs numeric comparison
    if (tableSortField === 'timestamp') {
      const getSeconds = (time: string) => {
        const [minutes, seconds] = time.split(':').map(Number);
        return minutes * 60 + seconds;
      };
      return (getSeconds(a.timestamp) - getSeconds(b.timestamp)) * multiplier;
    }
    
    // For all other fields, use string comparison
    const fieldA = String(a[tableSortField as keyof InsightRow]);
    const fieldB = String(b[tableSortField as keyof InsightRow]);
    return fieldA.localeCompare(fieldB) * multiplier;
  });

  const handleTableSort = (field: InsightSortField) => {
    if (tableSortField === field) {
      setTableSortOrder(tableSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortOrder('asc');
    }
  };

  const TableSortIcon = ({ field }: { field: InsightSortField }) => {
    if (tableSortField !== field) {
      return (
        <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30">
          <LucideChevronUp size={16} />
            </div>
      );
    }
    return tableSortOrder === 'asc' ? (
      <LucideChevronUp size={16} className="w-4 h-4 ml-1" />
    ) : (
      <LucideChevronDown size={16} className="w-4 h-4 ml-1" />
    );
  };

  const CompetitorCard = ({ competitor }: { competitor: Competitor }) => {
    const closedWonPercentage = competitor.closedDeals > 0 
      ? ((competitor.closedWonDeals / competitor.closedDeals) * 100).toFixed(1)
      : '0';
    const closedLostPercentage = competitor.closedDeals > 0
      ? ((competitor.closedLostDeals / competitor.closedDeals) * 100).toFixed(1)
      : '0';

    return (
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-semibold mb-2">{competitor.name}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Deals:</span>
            <span className="font-medium">{competitor.totalDeals}</span>
                </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Closed Deals:</span>
            <span className="font-medium">{competitor.closedDeals}</span>
                </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Open Deals:</span>
            <span className="font-medium">{competitor.openDeals}</span>
              </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Closed Won vs Lost:</span>
              <span className="font-medium">{closedWonPercentage}% vs {closedLostPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ 
                  width: `${closedWonPercentage}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to get unique values for a column
  const getUniqueColumnValues = (field: keyof ColumnFilter) => {
    return Array.from(new Set(apiData.map(item => {
      switch (field) {
        case 'dealTitle':
          return item.deal_title;
        case 'dealStage':
          return item.deal_stage;
        case 'salesStage':
          return item.sales_stage;
        case 'feature':
          return item.heading;
        case 'insight':
          return item.detail;
        case 'repName':
          return item.Rep_name;
        case 'repHandling':
          return item.Rep_handling;
        case 'productStatus':
          return item.tag;
        case 'nature':
          return item.Nature;
        default:
          return '';
      }
    }))).filter(Boolean).sort();
  };

  // Function to handle column filter changes
  const handleColumnFilterChange = (field: keyof ColumnFilter, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setColumnFilters({
      dealTitle: [],
      dealStage: [],
      salesStage: [],
      feature: [],
      insight: [],
      repName: [],
      repHandling: [],
      productStatus: [],
      nature: [],
    });
  };

  // Column Filter Dropdown Component
  const ColumnFilterDropdown = ({ field, label }: { field: keyof ColumnFilter; label: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const uniqueValues = getUniqueColumnValues(field);
    const hasActiveFilters = columnFilters[field].length > 0;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center text-left text-xs font-bold text-black uppercase tracking-wider group hover:text-gray-700 ${
            hasActiveFilters ? 'text-blue-600' : ''
          }`}
        >
          {label}
          <TableSortIcon field={field as any} />
          {hasActiveFilters && (
            <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-1.5 rounded-full">
              {columnFilters[field].length}
            </span>
          )}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="max-h-60 overflow-y-auto p-2">
              {uniqueValues.map(value => (
                <label key={value} className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={columnFilters[field].includes(value)}
                    onChange={() => handleColumnFilterChange(field, value)}
                    className="mr-2"
                  />
                  <span className="text-sm truncate">{value}</span>
                </label>
              ))}
                </div>
                </div>
        )}
              </div>
    );
  };

  // Get unique companies from API data
  const uniqueCompanies = useMemo(() => {
    return Array.from(new Set(apiData.map(item => item.company).filter(Boolean)));
  }, [apiData]);

  // Add function to get unique sales stages
  const uniqueSalesStages = useMemo(() => {
    return Array.from(new Set(apiData.map(item => item.sales_stage).filter(Boolean))).sort();
  }, [apiData]);

  // Update the filteredInsights logic to include sales stage filter
  const filteredInsights = useMemo(() => {
    let filtered = [...processedInsights];

    // Apply company filter
    if (selectedCompany) {
      filtered = filtered.filter(item => {
        const apiItem = apiData.find(api => api.Competitor_name === item.competitor);
        return apiItem?.company === selectedCompany;
      });
    }

    // Apply sales stage filter
    if (selectedSalesStages.length > 0) {
      filtered = filtered.filter(item => selectedSalesStages.includes(item.salesStage));
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(item => {
          const itemValue = (() => {
            switch (field) {
              case 'dealTitle':
                return item.dealTitle;
              case 'dealStage':
                return item.dealStage;
              case 'salesStage':
                return item.salesStage;
              case 'feature':
                return item.feature;
              case 'insight':
                return item.insight;
              case 'repName':
                return item.repName;
              case 'repHandling':
                return item.repHandling;
              case 'productStatus':
                return item.productStatus;
              case 'nature':
                return item.nature;
              default:
                return '';
            }
          })();
          return values.includes(itemValue);
        });
      }
    });

    // Apply existing filters (competitor, chart filters, etc.)
    if (selectedCompetitor && selectedCompetitor !== 'Overall') {
      filtered = filtered.filter(item => item.competitor === selectedCompetitor);
    }

    if (activeFilter.value) {
      filtered = filtered.filter(item => {
        switch (activeFilter.type) {
          case 'feature':
            return item.feature === activeFilter.value;
          case 'dealStage':
            return item.dealStage === activeFilter.value;
          case 'productStatus':
            return item.productStatus === activeFilter.value;
          case 'nature':
            return item.nature === activeFilter.value;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [processedInsights, selectedCompetitor, activeFilter, columnFilters, selectedCompany, apiData, selectedSalesStages]);

  // Update the competitors list to filter by company
  const filteredCompetitors = useMemo(() => {
    return competitors.filter(competitor => {
      const apiItem = apiData.find(api => api.Competitor_name === competitor.name);
      return apiItem?.company === selectedCompany;
    });
  }, [competitors, selectedCompany, apiData]);

  // Add function to process feature data with collapsible legend
  const processFeatureData = (data: ChartJSData<'pie', number[], string>): ChartJSData<'pie', number[], string> => {
    if (!isFeatureLegendExpanded && data.labels && data.labels.length > 5) {
      const labels = [...data.labels];
      const values = [...(data.datasets[0].data as number[])];
      
      // Sort features by value in descending order
      const combined = labels.map((label, i) => ({ label, value: values[i] }))
        .sort((a, b) => b.value - a.value);
      
      // Take top 5 features
      const top5 = combined.slice(0, 5);
      
      // Sum up the rest into "Other"
      const otherSum = combined.slice(5).reduce((sum, item) => sum + item.value, 0);
      
      return {
        labels: [...top5.map(item => item.label), 'Other'],
        datasets: [{
          data: [...top5.map(item => item.value), otherSum],
          backgroundColor: [
            '#9B59B6',  // Purple
            '#E67E22',  // Orange
            '#16A085',  // Dark Turquoise
            '#C0392B',  // Dark Red
            '#2980B9',  // Dark Blue
            '#95A5A6'   // Gray for Other
          ]
        }]
      };
    }
    
    return data;
  };

  // Update the processSalesStageData function
  const processSalesStageData = (data: ChartJSData<'pie', number[], string>): ChartJSData<'pie', number[], string> => {
    if (!isSalesLegendExpanded && data.labels && data.labels.length > 10) {
      const labels = [...data.labels];
      const values = [...(data.datasets[0].data as number[])];
      
      // Sort stages by value in descending order
      const combined = labels.map((label, i) => ({ label, value: values[i] }))
        .sort((a, b) => b.value - a.value);
      
      // Take top 10 stages
      const top10 = combined.slice(0, 10);
      
      // Sum up the rest into "Other"
      const otherSum = combined.slice(10).reduce((sum, item) => sum + item.value, 0);
      
      return {
        labels: [...top10.map(item => item.label), 'Other'],
        datasets: [{
          data: [...top10.map(item => item.value), otherSum],
          backgroundColor: [
            '#4CAF50',  // Green
            '#2196F3',  // Blue
            '#FFC107',  // Yellow
            '#9C27B0',  // Purple
            '#FF5722',  // Deep Orange
            '#795548',  // Brown
            '#607D8B',  // Blue Grey
            '#E91E63',  // Pink
            '#00BCD4',  // Cyan
            '#FF9800',  // Orange
            '#95A5A6'   // Gray for Other
          ]
        }]
      };
    }
    
    return data;
  };

  // Update the dot plot options
  const dotPlotOptions: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = context.raw;
            return `${point.label}: ${point.x.toFixed(1)}% win rate, ${point.y} deals`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Win Rate (%)',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Total Deals',
          font: {
            size: 12,
            weight: 'bold' as const
          }
        },
        min: 0,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      }
    }
  };

  // Update the dot plot data function
  const getDotPlotData = (competitors: Competitor[]) => {
    return {
      datasets: [{
        data: competitors.map(comp => ({
          x: (comp.closedWonDeals / (comp.closedWonDeals + comp.closedLostDeals) * 100) || 0,
          y: comp.totalDeals,
          label: comp.name
        })),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 0.8)',
        pointRadius: 6,
        pointHoverRadius: 8,
      }],
      labels: competitors
        .filter(comp => comp.totalDeals > 150)
        .map(comp => ({
          text: comp.name,
          point: {
            x: (comp.closedWonDeals / (comp.closedWonDeals + comp.closedLostDeals) * 100) || 0,
            y: comp.totalDeals
          }
        }))
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-[95%] mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Competitor Insights - Save deals where competitor was mentioned</h1>
            <a 
              href="https://docs.google.com/spreadsheets/d/1G66R17QVOiUh4Kw6JiyPC0RgO20XwFh4bqhRLAIjPLs/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              (Raw Data)
            </a>
          </div>
          <button 
            onClick={() => {
              const fetchData = async () => {
                try {
                  const response = await fetch('https://script.google.com/macros/s/AKfycbz6z1qUqGyEKh_psloIeBM5HzTk1FWV48kM0y9vva2v6sCrRovWUqi0Bj7-8x6tduQ4/exec');
                  if (!response.ok) {
                    throw new Error('Network response was not ok');
                  }
                  const data = await response.json();
                  setApiData(data);
                  setProcessedInsights(processApiData(data));
                  setCompetitors(processCompetitors(data));
                  if (data.length > 0 && data[0].company) {
                    setCompanyName(data[0].company);
                    setSelectedCompany(data[0].company);
                  }
                } catch (error) {
                  console.error('Error fetching data:', error);
                }
              };

              fetchData();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <LucideRefreshCw size={18} />
            <span>Refresh Data</span>
          </button>
                </div>
        
        {/* Company and Date Filter */}
        <div className="mb-8 flex items-center bg-white rounded-lg shadow p-4">
          <div className="flex items-center mr-6">
            <label className="font-medium text-gray-700 mr-3">Company:</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="font-medium text-gray-700 mr-3">Date Range:</label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
                </div>
              </div>
            </div>

        {/* Competitors Card - Full Width */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Competitors
                  </h3>
                  <div className="flex items-center space-x-2">
              <LucideUsers className="text-gray-400" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {/* Table Headers - Fixed */}
                  <div className="grid grid-cols-12 gap-4 mb-4 text-sm">
                    <button 
                      onClick={() => handleSort('name')}
                      className="col-span-3 flex items-center text-gray-600 font-medium group hover:text-gray-700"
                    >
                      Competitor
                      <SortIcon field="name" />
                    </button>
                    <button 
                      onClick={() => handleSort('totalDeals')}
                      className="col-span-1 flex items-center justify-center text-gray-600 font-medium group hover:text-gray-700 whitespace-nowrap"
                    >
                      Total Deals
                      <SortIcon field="totalDeals" />
                    </button>
                    <button 
                      onClick={() => handleSort('openDeals')}
                      className="col-span-2 flex items-center justify-center text-gray-600 font-medium group hover:text-gray-700 whitespace-nowrap"
                    >
                      Open Deals
                      <SortIcon field="openDeals" />
                    </button>
                    <button 
                      onClick={() => handleSort('closedDeals')}
                      className="col-span-2 flex items-center justify-center text-gray-600 font-medium group hover:text-gray-700 whitespace-nowrap"
                    >
                      Closed Deals
                      <SortIcon field="closedDeals" />
                    </button>
                    <div className="col-span-1 text-center text-gray-600 font-medium">Wins</div>
                    <div className="col-span-1 text-center text-gray-600 font-medium">Losses</div>
                    <div className="col-span-2 text-center text-gray-600 font-medium">Win Rate</div>
            </div>
            
                  {/* Scrollable Container - Height set to show 10 rows */}
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                    {/* Competitor Rows */}
                    {sortedCompetitors.map((competitor) => (
                      <div 
                        key={competitor.name} 
                        className={`grid grid-cols-12 gap-4 items-center h-12 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors text-sm ${
                          selectedCompetitor === competitor.name ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleCompetitorClick(competitor)}
                      >
                        <div className="col-span-3 font-medium truncate">{competitor.name}</div>
                        <div className="col-span-1 text-gray-600 text-center">{competitor.totalDeals}</div>
                        <div className="col-span-2 text-gray-600 text-center">{competitor.openDeals}</div>
                        <div className="col-span-2 text-gray-600 text-center">{competitor.closedDeals}</div>
                        <div className="col-span-1 text-gray-600 text-center">{competitor.closedWonDeals}</div>
                        <div className="col-span-1 text-gray-600 text-center">{competitor.closedLostDeals}</div>
                        <div className="col-span-2 text-gray-600 text-center">
                          {competitor.closedDeals > 0 
                            ? `${((competitor.closedWonDeals / competitor.closedDeals) * 100).toFixed(1)}%`
                            : '0%'
                          }
                </div>
                </div>
                    ))}
              </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow flex flex-col">
              <h3 className="text-lg font-semibold mb-4">Win Rate vs Total Deals</h3>
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-[400px]">
                  <Scatter
                    options={dotPlotOptions}
                    data={getDotPlotData(sortedCompetitors)}
                    plugins={[{
                      id: 'competitorLabels',
                      afterDraw: (chart) => {
                        const ctx = chart.ctx;
                        const data = chart.data as any;
                        if (data.labels) {
                          ctx.font = '12px Arial';
                          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                          ctx.textAlign = 'left';
                          
                          data.labels.forEach((label: { text: string, point: { x: number, y: number } }) => {
                            const xScale = chart.scales.x;
                            const yScale = chart.scales.y;
                            const x = xScale.getPixelForValue(label.point.x);
                            const y = yScale.getPixelForValue(label.point.y);
                            
                            ctx.fillText(label.text, x + 10, y - 10);
                          });
                        }
                      }
                    }]}
                  />
                </div>
              </div>
                </div>
              </div>

          {/* Selected Competitor and Sales Stage Insights */}
          <div className="mt-4 text-gray-600 mb-6 flex items-center gap-6">
            <div className="flex items-center">
              <span>Showing competitor insights for</span>
              <select
                value={selectedCompetitor}
                onChange={handleInsightSelect}
                className="mx-2 px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="Overall">Overall</option>
                {competitors.map(comp => (
                  <option key={comp.name} value={comp.name}>
                    {comp.name}
                  </option>
                ))}
              </select>
                </div>

            <div className="flex items-center">
              <span>in sales stages</span>
              <div className="relative mx-2">
                <button
                  onClick={() => setIsSalesStageDropdownOpen(!isSalesStageDropdownOpen)}
                  className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[200px] flex items-center justify-between"
                >
                  <span className="truncate">
                    {selectedSalesStages.length === 0 
                      ? 'Select stages' 
                      : `${selectedSalesStages.length} selected`}
                  </span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isSalesStageDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                    <div className="max-h-60 overflow-y-auto p-2">
                      {uniqueSalesStages.map(stage => (
                        <label 
                          key={stage}
                          className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSalesStages.includes(stage)}
                            onChange={() => {
                              setSelectedSalesStages(prev =>
                                prev.includes(stage)
                                  ? prev.filter(s => s !== stage)
                                  : [...prev, stage]
                              );
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{stage}</span>
                        </label>
                      ))}
                </div>
                    {selectedSalesStages.length > 0 && (
                      <div className="p-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedSalesStages([]);
                            setIsSalesStageDropdownOpen(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none"
                        >
                          Clear all
                        </button>
              </div>
                    )}
            </div>
                )}
                
                {selectedSalesStages.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedSalesStages.map(stage => (
                      <span 
                        key={stage}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {stage}
                        <button
                          onClick={() => setSelectedSalesStages(prev => prev.filter(s => s !== stage))}
                          className="ml-1 hover:text-blue-900 focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* First Row - Sales Stage Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                When in deal do competitors enter in the conversation?
                {activeFilter.type === 'salesStage' && activeFilter.value && (
                  <button 
                    onClick={() => setActiveFilter({ type: 'salesStage', value: null })}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Clear Filter)
                  </button>
                )}
              </h3>
              <button
                onClick={() => setIsSalesLegendExpanded(!isSalesLegendExpanded)}
                className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                {isSalesLegendExpanded ? 'Show less stages' : 'Show all stages'}
              </button>
            </div>
            <div className="h-[400px] relative cursor-pointer">
              {chartData && <Pie data={processSalesStageData(chartData.salesStageData)} options={chartOptions} id="salesStage-chart" />}
              </div>
            </div>
            
          {/* Second Row - 2 Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* How are prospect considering competitor? Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                How are prospect considering competitor?
                {activeFilter.type === 'productStatus' && activeFilter.value && (
                  <button 
                    onClick={() => setActiveFilter({ type: 'productStatus', value: null })}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Clear Filter)
                  </button>
                )}
              </h3>
              <div className="h-[400px] relative cursor-pointer">
                {chartData && <Pie data={chartData.productStatusData} options={chartOptions} id="productStatus-chart" />}
              </div>
            </div>

            {/* How has prospect comparing competitor and {companyName}? Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                How has prospect comparing competitor and {companyName}?
                {activeFilter.type === 'nature' && activeFilter.value && (
                  <button 
                    onClick={() => setActiveFilter({ type: 'nature', value: null })}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Clear Filter)
                  </button>
                )}
              </h3>
              <div className="h-[400px] relative cursor-pointer">
                {chartData && <Pie data={chartData.natureData} options={chartOptions} id="nature-chart" />}
              </div>
            </div>
          </div>

          {/* Third Row - Feature Chart */}
          <div className="grid grid-cols-1">
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Competitive Features Discussed
                  {activeFilter.type === 'feature' && activeFilter.value && (
                    <button 
                      onClick={() => setActiveFilter({ type: 'feature', value: null })}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      (Clear Filter)
                    </button>
                  )}
                </h3>
                <button
                  onClick={() => setIsFeatureLegendExpanded(!isFeatureLegendExpanded)}
                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  {isFeatureLegendExpanded ? 'Show less features' : 'Show all features'}
                </button>
            </div>
              <div className="h-[400px] relative cursor-pointer">
                {chartData && (
                  <Pie 
                    data={processFeatureData(chartData.featureData)} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: 'right' as const,
                          labels: {
                            ...chartOptions.plugins.legend.labels,
                            boxWidth: 12,
                            padding: 15,
                            generateLabels: (chart: ChartJS) => {
                              const datasets = chart.data.datasets;
                              const labels = chart.data.labels || [];
                              
                              return labels.map((label, i) => ({
                                text: label as string,
                                fillStyle: datasets[0].backgroundColor 
                                  ? Array.isArray(datasets[0].backgroundColor) 
                                    ? datasets[0].backgroundColor[i] 
                                    : datasets[0].backgroundColor
                                  : undefined,
                                hidden: false,
                                index: i,
                                datasetIndex: 0,
                                strokeStyle: '#fff'
                              }));
                            }
                          }
                        }
                      }
                    } as ChartOptions<'pie'>}
                    id="feature-chart" 
                  />
                )}
              </div>
        </div>
              </div>
            </div>

        {/* Static Insights Card */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          {/* Left Section - Top 15 Objections */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              Top 15 Objections against Versa Networks 'Close - Lost' Deals (When Palo Alto Was Mentioned) - WIP
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {[
                { title: "Performance Concerns", desc: "Prospects reported slower transaction speeds with Versa compared to Palo Alto, especially for critical applications." },
                { title: "Feature Gaps", desc: "Missing or immature features (e.g., fail-to-wire, scripting for policy migration) compared to Palo Alto's mature stack." },
                { title: "Incumbent Vendor Lock-In", desc: "Existing investments in Palo Alto firewalls and subscriptions made switching costly and complex." },
                { title: "ZTNA and VPN Maturity", desc: "Palo Alto's GlobalProtect ZTNA is seen as more mature and reliable than Versa's current offering." },
                { title: "Dashboard and Usability", desc: "Palo Alto's management dashboards (e.g., Cortex) are perceived as more robust and user-friendly." },
                { title: "Brand Trust and Market Perception", desc: "Palo Alto's strong reputation and Gartner leadership influence decision-makers, especially in risk-averse enterprises." },
                { title: "Integration with Existing Tools", desc: "Better integration with Azure AD and other enterprise tools cited as a Palo Alto advantage." },
                { title: "Dynamic DNS/URL Filtering", desc: "Versa's URL filtering categories (e.g., dynamic DNS) were seen as less comprehensive than Palo Alto's." },
                { title: "HA and Licensing Models", desc: "Concerns about Versa's high-availability architecture and changes in Palo Alto's licensing making competition tougher." },
                { title: "Compliance and Certifications", desc: "Palo Alto's established compliance modules (e.g., FIPS 140-2) are preferred by regulated industries." },
                { title: "Channel and Partner Preferences", desc: "Partners and resellers often have established relationships and incentives with Palo Alto." },
                { title: "Delayed Feature Delivery", desc: "POC and SASE feature delays led to prospects renewing with Palo Alto to avoid double payments." },
                { title: "Multi-Vendor Preference", desc: "Some prospects prefer a multi-vendor approach for redundancy, citing concerns about putting all eggs in one basket." },
                { title: "Analytics and Reporting Maturity", desc: "Concerns about Versa's analytics engine handling large-scale deployments as robustly as Palo Alto's Panorama." },
                { title: "Migration and Change Management", desc: "Fear of disruption and migration complexity when moving from a known Palo Alto environment to Versa." }
              ].map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <h4 className="font-semibold text-red-600 mb-2">{index + 1}. {item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - Top 15 Positives */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-6 text-gray-800">
              Top 15 Positives in Versa Networks 'Close - Won' Deals (When Palo Alto Was Mentioned) - WIP
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {[
                { title: "Unified SASE Platform", desc: "Versa offers a single platform for networking and security, reducing complexity and vendor sprawl." },
                { title: "Lower Total Cost of Ownership", desc: "Versa's pricing is often 25-50% lower than Palo Alto, with significant savings on subscriptions and hardware renewals." },
                { title: "Simplified Management", desc: "Versa's management interface is more intuitive, easing operational burden for IT teams compared to Palo Alto's complex device groups and templates." },
                { title: "Flexible Deployment Options", desc: "Supports on-premises, cloud, and hybrid deployments, providing more flexibility than Palo Alto's cloud-first focus." },
                { title: "Seamless Policy Migration", desc: "Versa enables easier migration of firewall policies from Palo Alto, minimizing disruption during transitions." },
                { title: "Integrated SD-WAN and Security", desc: "Networking and security are natively integrated, reducing the need for multiple appliances and interfaces." },
                { title: "Superior Multi-Tenancy", desc: "Versa's platform supports advanced multi-tenancy and VRF, ideal for complex enterprise environments." },
                { title: "Granular Analytics and Logging", desc: "Unified logging and analytics provide detailed visibility, helping with compliance and troubleshooting." },
                { title: "Strong API and Automation Support", desc: "Versa supports Terraform and Ansible for infrastructure automation, addressing a common gap in Palo Alto's offering." },
                { title: "Cost-Effective Licensing Models", desc: "Bandwidth-based and user-based licensing options offer flexibility and cost control, unlike Palo Alto's traditional site-based model." },
                { title: "Ruggedized and Diverse Deployments", desc: "Versa supports deployments in harsh environments and across diverse hardware, meeting unique customer needs." },
                { title: "Superior SD-WAN Capabilities", desc: "Versa's SD-WAN performance and features are consistently rated higher than Palo Alto's SD-WAN offerings." },
                { title: "Comprehensive Security Stack", desc: "Versa includes advanced security features like DLP, IDS/IPS, and RBI in one platform." },
                { title: "Quick and Reliable Support", desc: "Customers report faster, more responsive support from Versa compared to larger competitors." },
                { title: "Proven Large-Scale Replacements", desc: "Versa has successfully replaced hundreds of Palo Alto firewalls in large organizations, demonstrating scalability and reliability." }
              ].map((item, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                  <h4 className="font-semibold text-green-600 mb-2">{index + 1}. {item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Table */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="overflow-hidden">
            <div className="max-h-[900px] overflow-auto">
              <table className="min-w-max w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="bg-gray-50 px-3 py-3 min-w-[180px] w-[180px]">
                      <ColumnFilterDropdown field="dealTitle" label="Deal Title" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[120px] w-[120px]">
                      <ColumnFilterDropdown field="dealStage" label="Deal Stage" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[120px] w-[120px]">
                      <ColumnFilterDropdown field="salesStage" label="Stage During the Call" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[150px] w-[150px]">
                      <ColumnFilterDropdown field="feature" label="Feature" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[250px] w-[250px]">
                      <ColumnFilterDropdown field="insight" label="Insight/Objection" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[120px] w-[120px]">
                      <ColumnFilterDropdown field="repName" label="Rep Name" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[200px] w-[200px]">
                      <ColumnFilterDropdown field="repHandling" label="Rep Handling" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[160px] w-[160px]">
                      <button 
                        onClick={() => handleTableSort('timestamp')}
                        className="flex items-center text-left text-xs font-bold text-black uppercase tracking-wider group hover:text-gray-700"
                      >
                        Timestamp
                        <TableSortIcon field="timestamp" />
                      </button>
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[140px] w-[140px]">
                      <ColumnFilterDropdown field="productStatus" label="Product Status" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[120px] w-[120px]">
                      <ColumnFilterDropdown field="nature" label="Nature" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInsights.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[180px] w-[180px] truncate">{row.dealTitle}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px] w-[120px] truncate">{row.dealStage}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px] w-[120px] truncate">{row.salesStage}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[150px] w-[150px] truncate">{row.feature}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[250px] w-[250px] whitespace-normal">{row.insight}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px] w-[120px] truncate">{row.repName}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[200px] w-[200px] whitespace-normal">{row.repHandling}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[160px] w-[160px]">
                        <a 
                          href={row.callLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                        >
                          {row.timestamp}
                        </a>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[140px] w-[140px] truncate">{row.productStatus}</td>
                      <td className="px-3 py-4 text-sm text-gray-900 min-w-[120px] w-[120px] truncate">{row.nature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Clear Filters button above the table when filters are active */}
        {Object.values(columnFilters).some(filters => filters.length > 0) && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center gap-1"
            >
              <span>Clear All Filters</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-1.5 rounded-full">
                {Object.values(columnFilters).reduce((acc, filters) => acc + filters.length, 0)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;