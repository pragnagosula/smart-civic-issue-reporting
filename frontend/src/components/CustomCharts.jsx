import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import './CustomCharts.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Government Color Palette
const govColors = {
    primary: '#1565c0',
    success: '#2e7d32',
    warning: '#f57c00',
    error: '#c62828',
    info: '#0288d1',
    secondary: '#64748b',
    saffron: '#ff6f00',
    navy: '#1a237e'
};

// Chart Defaults
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                font: {
                    family: 'Inter, sans-serif',
                    size: 12,
                    weight: '500'
                },
                padding: 15,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: {
                family: 'Inter, sans-serif',
                size: 13,
                weight: '600'
            },
            bodyFont: {
                family: 'Inter, sans-serif',
                size: 12
            },
            padding: 12,
            borderColor: '#334155',
            borderWidth: 1,
            displayColors: true,
            callbacks: {
    label: function(context) {
        let label = context.dataset.label || '';
        if (label) label += ': ';

        const value =
            context.parsed?.y ??
            context.parsed ??
            context.raw ??
            0;

        return label + Number(value).toLocaleString();
    }
}

        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false
            },
            ticks: {
                font: {
                    family: 'Inter, sans-serif',
                    size: 11
                },
                color: '#64748b'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: '#f1f5f9',
                drawBorder: false
            },
            ticks: {
                font: {
                    family: 'Inter, sans-serif',
                    size: 11
                },
                color: '#64748b',
                callback: function(value) {
                    return value.toLocaleString();
                }
            }
        }
    }
};

export const CustomLineChart = ({ data, title, height = 300 }) => {
    const options = {
        ...defaultOptions,
        plugins: {
            ...defaultOptions.plugins,
            title: {
                display: !!title,
                text: title,
                font: {
                    family: 'IBM Plex Sans, sans-serif',
                    size: 16,
                    weight: '600'
                },
                color: '#212121',
                padding: {
                    bottom: 20
                }
            }
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 3
            },
            point: {
                radius: 4,
                hoverRadius: 6,
                borderWidth: 2,
                backgroundColor: '#ffffff'
            }
        }
    };

    return (
        <div className="chart-container" style={{ height: `${height}px` }}>
            <Line options={options} data={data} />
        </div>
    );
};

export const CustomBarChart = ({ data, title, horizontal = false, height = 300 }) => {
    const options = {
        ...defaultOptions,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
            ...defaultOptions.plugins,
            title: {
                display: !!title,
                text: title,
                font: {
                    family: 'IBM Plex Sans, sans-serif',
                    size: 16,
                    weight: '600'
                },
                color: '#212121',
                padding: {
                    bottom: 20
                }
            }
        },
        elements: {
            bar: {
                borderRadius: 6,
                borderSkipped: false
            }
        }
    };

    return (
        <div className="chart-container" style={{ height: `${height}px` }}>
            <Bar options={options} data={data} />
        </div>
    );
};

export const CustomPieChart = ({ data, title, height = 300 }) => {
    const options = {
        ...defaultOptions,
        plugins: {
            ...defaultOptions.plugins,
            title: {
                display: !!title,
                text: title,
                font: {
                    family: 'IBM Plex Sans, sans-serif',
                    size: 16,
                    weight: '600'
                },
                color: '#212121',
                padding: {
                    bottom: 20
                }
            }
        },
        elements: {
            arc: {
                borderWidth: 2,
                borderColor: '#ffffff'
            }
        }
    };

    return (
        <div className="chart-container" style={{ height: `${height}px` }}>
            <Pie options={options} data={data} />
        </div>
    );
};

export const CustomDoughnutChart = ({ data, title, centerText, centerValue, height = 300 }) => {
    const options = {
        ...defaultOptions,
        cutout: '70%',
        plugins: {
            ...defaultOptions.plugins,
            title: {
                display: !!title,
                text: title,
                font: {
                    family: 'IBM Plex Sans, sans-serif',
                    size: 16,
                    weight: '600'
                },
                color: '#212121',
                padding: {
                    bottom: 20
                }
            }
        },
        elements: {
            arc: {
                borderWidth: 3,
                borderColor: '#ffffff'
            }
        }
    };

    return (
        <div className="chart-container doughnut-container" style={{ height: `${height}px`, position: 'relative' }}>
            <Doughnut options={options} data={data} />
            {centerText && centerValue && (
                <div className="doughnut-center-text">
                    <div className="doughnut-value">{centerValue}</div>
                    <div className="doughnut-label">{centerText}</div>
                </div>
            )}
        </div>
    );
};

// Helper function to generate government color scheme
export const getGovColorScheme = (count) => {
    const colors = [
        govColors.primary,
        govColors.success,
        govColors.warning,
        govColors.info,
        govColors.saffron,
        govColors.navy,
        govColors.error,
        govColors.secondary
    ];
    
    const scheme = [];
    for (let i = 0; i < count; i++) {
        scheme.push(colors[i % colors.length]);
    }
    return scheme;
};

// Helper function to create gradient backgrounds
export const createGradient = (ctx, color) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
};