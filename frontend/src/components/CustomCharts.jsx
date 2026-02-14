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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export const CustomLineChart = ({ data, title }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: !!title, text: title },
        },
    };
    return <Line options={options} data={data} />;
};

export const CustomBarChart = ({ data, title, horizontal = false }) => {
    const options = {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: !!title, text: title },
        },
    };
    return <Bar options={options} data={data} />;
};

export const CustomPieChart = ({ data, title }) => {
    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: !!title, text: title },
        },
    };
    return <Pie options={options} data={data} />;
};
