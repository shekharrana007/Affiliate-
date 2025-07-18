import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { serverEndpoint } from "../../config/config";
import { DataGrid } from "@mui/x-data-grid";
import { Bar, Pie } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MdAnalytics } from 'react-icons/md';
import { FaTable } from 'react-icons/fa';


import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement,
    Tooltip,
    Legend,
    Title
} from 'chart.js';

ChartJS.register(
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement,
    Tooltip,
    Legend,
    Title
)
const formatDate = (isoDateString) => {
    if (!isoDateString) {
        return '';
    }
    try {
        const date = new Date(isoDateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
    catch (error) {
        console.log(error);
        return '';
    }
};
function AnalyticsDashboard() {
    const { linkId } = useParams();
    const navigate = useNavigate();
    const [analyticsData, setAnalyticsData] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const fetchLinkAnalytics = async () => {
        try {
            const response = await axios.get(`${serverEndpoint}/links/analytics`, {
                params: {
                    linkId: linkId,
                    from: fromDate,
                    to: toDate
                },
                withCredentials: true
            });
            setAnalyticsData(response.data);
            console.log(response.data);
        }
        catch (error) {
            console.log(error);
            ///it navigate to error page
            navigate('/error');
        }
    };

    const groupBy = (key) => {
        return analyticsData.reduce((acc, item) => {
            const label = item[key] || 'Unknown';
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
    };

    const clicksByCity = groupBy('city');
    const clicksByBrowser = groupBy('browser');

    const columns = [
        { field: 'ip', headerName: 'IP Address', flex: 1 },
        { field: 'city', headerName: 'City', flex: 1 },
        { field: 'country', headerName: 'Country', flex: 1 },
        { field: 'browser', headerName: 'Browser', flex: 1 },
        { field: 'device', headerName: 'Device', flex: 1 },
        { field: 'isp', headerName: 'ISP', flex: 1 },
        {
            field: 'clickedAt', headerName: 'Click Date', flex: 1, renderCell: (params) => (
                <>{formatDate(params.row.clickedAt)}</>
            )
        },
    ];
    useEffect(() => {
        fetchLinkAnalytics();
    }, [analyticsData, fromDate, toDate]);
    return (
        <div className="container py-5 analytics-fadein" style={{ maxWidth: 1200 }}>
            <style>{`
                .analytics-fadein {
                    animation: fadeInAnalytics 0.9s cubic-bezier(0.4,0,0.2,1);
                }
                @keyframes fadeInAnalytics {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: none; }
                }
                .analytics-header {
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;
                    font-size: 2.1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                }
                .analytics-header .analytics-icon {
                    color: #0d6efd;
                    font-size: 2.5rem;
                    filter: drop-shadow(0 2px 8px rgba(13,110,253,0.13));
                }
                .analytics-card {
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                    transition: box-shadow 0.18s, transform 0.18s;
                    background: #fff;
                }
                .analytics-card:hover {
                    box-shadow: 0 8px 32px rgba(13,110,253,0.13);
                    transform: translateY(-2px) scale(1.01);
                }
                .analytics-filter-btn {
                    font-weight: 600;
                    border-radius: 8px;
                    padding: 0.5rem 1.5rem;
                    font-size: 1.08rem;
                }
            `}</style>
            <div className="analytics-header">
                <span className="analytics-icon"><MdAnalytics /></span>
                Analytics for LinkID: <span className="text-primary" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{linkId}</span>
            </div>
            <div className="card p-4 mb-4 shadow-sm analytics-card">
                <h5 className="mb-3">Filters</h5>
                <div className="row g-3 align-items-center">
                    <div className="col-md-3">
                        <DatePicker
                            selected={fromDate}
                            onChange={date => setFromDate(date)}
                            className="form-control"
                            placeholderText="From (Date)"
                            dateFormat="yyyy-MM-dd"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3">
                        <DatePicker
                            selected={toDate}
                            onChange={date => setToDate(date)}
                            className="form-control"
                            placeholderText="To (Date)"
                            dateFormat="yyyy-MM-dd"
                            isClearable
                        />
                    </div>
                    <div className="col-md-3">
                        <button className="btn btn-primary analytics-filter-btn" onClick={fetchLinkAnalytics}>
                            Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-lg-6 mb-4 d-flex align-items-stretch">
                    <div className="card p-3 shadow-sm w-100 analytics-card" style={{ minHeight: 400, maxWidth: 500, margin: "0 auto" }}>
                        <h5 className="mb-3">Clicks by City</h5>
                        <div style={{ height: 300 }}>
                            <Bar
                                data={{
                                    labels: Object.keys(clicksByCity),
                                    datasets: [
                                        {
                                            label: 'Clicks',
                                            data: Object.values(clicksByCity),
                                            backgroundColor: "rgba(54,162,235,0.6)",
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { display: false }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-lg-6 mb-4 d-flex align-items-stretch">
                    <div className="card p-3 shadow-sm w-100 analytics-card" style={{ minHeight: 400, maxWidth: 500, margin: "0 auto" }}>
                        <h5 className="mb-3">Clicks by Browser</h5>
                        <div style={{ height: 300 }}>
                            <Pie
                                data={{
                                    labels: Object.keys(clicksByBrowser),
                                    datasets: [
                                        {
                                            data: Object.values(clicksByBrowser),
                                            backgroundColor: [
                                                '#FF6384',
                                                '#36A2EB',
                                                '#FFCE56',
                                                '#4BC0C0',
                                                '#9966FF',
                                                '#FF9F40',
                                            ],
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'bottom' }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card p-3 shadow-sm analytics-card analytics-details-fadein">
                <style>{`
                    .analytics-details-fadein {
                        animation: fadeInDetails 0.8s cubic-bezier(0.4,0,0.2,1);
                    }
                    @keyframes fadeInDetails {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: none; }
                    }
                    .analytics-details-header {
                        display: flex;
                        align-items: center;
                        gap: 0.6rem;
                        font-size: 1.3rem;
                        font-weight: 700;
                        margin-bottom: 1.1rem;
                    }
                `}</style>
                <div className="analytics-details-header">
                    <FaTable style={{ color: '#0d6efd', fontSize: '1.5rem' }} />
                    Click Details
                </div>
                <DataGrid
                    getRowId={(row) => row._id}
                    rows={analyticsData}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: 20, page: 0 }
                        }
                    }}
                    pageSizeOptions={[20, 50, 100]}
                    disableRowSelectionOnClick
                    autoHeight
                    sx={{
                        fontFamily: 'inherit',
                        background: "#fff",
                        borderRadius: '14px',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: '#f4f8fc',
                            fontWeight: 700,
                            fontSize: '1.07rem',
                        },
                        '& .MuiDataGrid-row': {
                            fontSize: '1.01rem',
                        },
                        '& .MuiDataGrid-footerContainer': {
                            backgroundColor: '#f8fafc',
                        }
                    }}
                />
            </div>
        </div>
    );
}
export default AnalyticsDashboard;