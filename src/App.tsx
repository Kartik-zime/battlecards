import React, { useState, useEffect, useMemo } from 'react';
import { LucideUsers, LucideChevronUp, LucideChevronDown, LucideRefreshCw } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ApiData {
  Competitor_name: string;
  deal_id: string;
  deal_stage: string;
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
  type: 'feature' | 'dealStage' | 'productStatus' | 'nature';
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
};

interface ColumnFilter {
  dealTitle: string[];
  dealStage: string[];
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
  callDate: string;
  callLink: string;
  competitor: string;
}

function App() {
  const [apiData, setApiData] = useState<ApiData[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | 'Overall'>('Overall');
  const [tableSortField, setTableSortField] = useState<InsightSortField>('timestamp');
  const [tableSortOrder, setTableSortOrder] = useState<SortOrder>('asc');
  const [activeFilter, setActiveFilter] = useState<ChartFilter>({ type: 'feature', value: null });
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    dealTitle: [],
    dealStage: [],
    feature: [],
    insight: [],
    repName: [],
    repHandling: [],
    productStatus: [],
    nature: [],
  });
  const [processedInsights, setProcessedInsights] = useState<ProcessedInsight[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbz6z1qUqGyEKh_psloIeBM5HzTk1FWV48kM0y9vva2v6sCrRovWUqi0Bj7-8x6tduQ4/exec');
        const data: ApiData[] = await response.json();
        setApiData(data);
        const processedData = processApiData(data);
        setProcessedInsights(processedData);
        processCompetitors(data);
        
        if (data.length > 0 && data[0].company) {
          setCompanyName(data[0].company);
        } else {
          setCompanyName('Zime');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
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

    setCompetitors(Array.from(competitorMap.values()));
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

  const sortedCompetitors = sortCompetitors(competitors, sortField, sortOrder);

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
    const relevantCompetitors = selectedCompetitor && selectedCompetitor !== 'Overall'
      ? competitors.filter(comp => comp.name === selectedCompetitor)
      : competitors;

    // Helper function to calculate percentages
    const calculatePercentages = (data: { [key: string]: number }) => {
      const total = Object.values(data).reduce((sum, val) => sum + val, 0);
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, (value / total) * 100])
      );
    };

    // Aggregate data across competitors
    const aggregatedData = relevantCompetitors.reduce<AggregatedData>((acc, competitor) => {
      // Product Status (tag)
      Object.entries(competitor.productStatus).forEach(([key, value]) => {
        acc.productStatus[key] = (acc.productStatus[key] || 0) + value;
      });

      // Nature
      Object.entries(competitor.insightNature).forEach(([key, value]) => {
        acc.nature[key] = (acc.nature[key] || 0) + value;
      });

      // Deal Stage
      Object.entries(competitor.dealStage).forEach(([key, value]) => {
        acc.dealStage[key] = (acc.dealStage[key] || 0) + value;
      });

      // Features
      Object.entries(competitor.features).forEach(([key, value]) => {
        acc.features[key] = (acc.features[key] || 0) + value;
      });

      return acc;
    }, {
      productStatus: {},
      nature: {},
      dealStage: {},
      features: {}
    });

    // Generate chart data with dynamic labels and values
    return {
      productStatusData: {
        labels: Object.keys(aggregatedData.productStatus),
        datasets: [{
          data: Object.values(aggregatedData.productStatus),
          backgroundColor: [
            '#4A90E2',
            '#E54D42',
            '#F5A623',
            '#7ED321',
            '#B8E986',
            '#50E3C2'
          ].slice(0, Object.keys(aggregatedData.productStatus).length)
        }]
      },
      natureData: {
        labels: Object.keys(aggregatedData.nature),
        datasets: [{
          data: Object.values(aggregatedData.nature),
          backgroundColor: [
            '#7ED321',
            '#4A90E2',
            '#E54D42'
          ].slice(0, Object.keys(aggregatedData.nature).length)
        }]
      },
      dealStageData: {
        labels: Object.keys(aggregatedData.dealStage),
        datasets: [{
          data: Object.values(aggregatedData.dealStage),
          backgroundColor: [
            '#7ED321',
            '#E54D42',
            '#4A90E2'
          ].slice(0, Object.keys(aggregatedData.dealStage).length)
        }]
      },
      featureData: {
        labels: Object.keys(aggregatedData.features),
        datasets: [{
          data: Object.values(aggregatedData.features),
          backgroundColor: [
            '#4A90E2',
            '#50E3C2',
            '#F5A623',
            '#E54D42',
            '#B8E986',
            '#7ED321'
          ].slice(0, Object.keys(aggregatedData.features).length)
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

  // Update the filtered insights logic
  const filteredInsights = useMemo(() => {
    let filtered = [...processedInsights];

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
  }, [processedInsights, selectedCompetitor, activeFilter, columnFilters]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Competitor Insights - Save deals where competitor was mentioned</h1>
          <button 
            onClick={() => {
              const fetchData = async () => {
                try {
                  const response = await fetch('https://script.google.com/macros/s/AKfycbz6z1qUqGyEKh_psloIeBM5HzTk1FWV48kM0y9vva2v6sCrRovWUqi0Bj7-8x6tduQ4/exec');
                  const data: ApiData[] = await response.json();
                  setApiData(data);
                  const processedData = processApiData(data);
                  setProcessedInsights(processedData);
                  processCompetitors(data);
                  
                  if (data.length > 0 && data[0].company) {
                    setCompanyName(data[0].company);
                  } else {
                    setCompanyName('Zime');
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
        
        {/* Date Filter */}
        <div className="mb-8 flex items-center bg-white rounded-lg shadow p-4">
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

        {/* Competitors Card - Full Width */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Competitors</h2>
            <LucideUsers className="text-gray-400" />
          </div>
          
          {/* Table Headers - Fixed */}
          <div className="grid grid-cols-12 mb-4 text-sm text-gray-500">
            <button 
              onClick={() => handleSort('name')}
              className="col-span-4 flex items-center font-medium group hover:text-gray-700"
            >
              Competitor
              <SortIcon field="name" />
            </button>
            <button 
              onClick={() => handleSort('totalDeals')}
              className="col-span-2 flex items-center font-medium group hover:text-gray-700"
            >
              Total Deals
              <SortIcon field="totalDeals" />
            </button>
            <button 
              onClick={() => handleSort('openDeals')}
              className="col-span-2 flex items-center font-medium group hover:text-gray-700"
            >
              Open Deals
              <SortIcon field="openDeals" />
            </button>
            <button 
              onClick={() => handleSort('closedDeals')}
              className="col-span-2 flex items-center font-medium group hover:text-gray-700"
            >
              Closed Deals
              <SortIcon field="closedDeals" />
            </button>
            <div className="col-span-2">Closed Won vs Closed Lost</div>
          </div>

          {/* Scrollable Container - Height set to show exactly 3 rows */}
          <div className="space-y-4 max-h-[144px] overflow-y-auto pr-2">
            {/* Competitor Rows */}
            {sortedCompetitors.map((competitor) => (
              <div 
                key={competitor.name} 
                className={`grid grid-cols-12 items-center h-12 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                  selectedCompetitor === competitor.name ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleCompetitorClick(competitor)}
              >
                <div className="col-span-4 font-medium">{competitor.name}</div>
                <div className="col-span-2 text-gray-600">{competitor.totalDeals}</div>
                <div className="col-span-2 text-gray-600">{competitor.openDeals}</div>
                <div className="col-span-2 text-gray-600">{competitor.closedDeals}</div>
                <div className="col-span-2 group relative">
                  {/* Tooltip */}
                  <div className="absolute top-1/2 right-full transform -translate-y-1/2 mr-2 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none min-w-max">
                    Won: {competitor.closedWonDeals} | Lost: {competitor.closedLostDeals}
                  </div>
                  
                  {/* Combined Progress Bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div 
                        className="h-full bg-green-500"
                        style={{ 
                          width: `${competitor.closedDeals > 0 ? (competitor.closedWonDeals / competitor.closedDeals) * 100 : 0}%`,
                          transition: 'width 0.3s ease-in-out'
                        }}
                      />
                      <div 
                        className="h-full bg-red-500"
                        style={{ 
                          width: `${competitor.closedDeals > 0 ? (competitor.closedLostDeals / competitor.closedDeals) * 100 : 0}%`,
                          transition: 'width 0.3s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Competitor Insights */}
        <div className="mt-4 text-gray-600 mb-6 flex items-center">
          <span>Showing the insights for</span>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* First Row - 3 Charts */}
          <div className="grid grid-cols-3 gap-6">
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
              <div className="h-[300px] relative cursor-pointer">
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
              <div className="h-[300px] relative cursor-pointer">
                {chartData && <Pie data={chartData.natureData} options={chartOptions} id="nature-chart" />}
              </div>
            </div>

            {/* Deal Stage Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Deal Stage
                {activeFilter.type === 'dealStage' && activeFilter.value && (
                  <button 
                    onClick={() => setActiveFilter({ type: 'dealStage', value: null })}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Clear Filter)
                  </button>
                )}
              </h3>
              <div className="h-[300px] relative cursor-pointer">
                {chartData && <Pie data={chartData.dealStageData} options={chartOptions} id="dealStage-chart" />}
              </div>
            </div>
          </div>

          {/* Second Row - Feature Chart */}
          <div className="grid grid-cols-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Feature Discussed
                {activeFilter.type === 'feature' && activeFilter.value && (
                  <button 
                    onClick={() => setActiveFilter({ type: 'feature', value: null })}
                    className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    (Clear Filter)
                  </button>
                )}
              </h3>
              <div className="h-[300px] relative cursor-pointer">
                {chartData && <Pie data={chartData.featureData} options={chartOptions} id="feature-chart" />}
              </div>
            </div>
          </div>
        </div>

        {/* Insights Table */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-max w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="bg-gray-50 px-3 py-3 min-w-[180px] w-[180px]">
                      <ColumnFilterDropdown field="dealTitle" label="Deal Title" />
                    </th>
                    <th className="bg-gray-50 px-3 py-3 min-w-[120px] w-[120px]">
                      <ColumnFilterDropdown field="dealStage" label="Deal Stage" />
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