import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    TableSortLabel,
    TablePagination,
    TextField,
    Button
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import moment from 'moment';

const COLORS = ['#00C49F', '#FF8042'];
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ProductQualityDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [productData, setProductData] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [employeeProductInjectionIndex, setEmployeeProductInjectionIndex] = useState([]);
    const [filterEmployeeProductIndex, setFilterEmployeeProductIndex] = useState('total');
    const [pecasList, setPecasList] = useState([]);

    const [dateRange, setDateRange] = useState({
        start: moment().subtract(29, 'days').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
    });
    const [appliedFilters, setAppliedFilters] = useState(dateRange);

    const [sortColumnEmployee, setSortColumnEmployee] = useState('indice');
    const [sortDirectionEmployee, setSortDirectionEmployee] = useState('desc');

    const [pageProducts, setPageProducts] = useState(0);
    const [rowsPerPageProducts, setRowsPerPageProducts] = useState(15);
    const [sortColumnProducts, setSortColumnProducts] = useState('taxaNC');
    const [sortDirectionProducts, setSortDirectionProducts] = useState('desc');

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.level < 2) {
                navigate('/home', { replace: true });
                return;
            }
        }

        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const dataListsResponse = await axios.get(`${API_URL}/api/data/lists`);
                setPecasList(dataListsResponse.data.pecas);

                const params = {
                    dataInicio: appliedFilters.start,
                    dataFim: appliedFilters.end,
                };

                const apontamentosResponse = await axios.get(`${API_URL}/api/apontamentos/injetora`, { params });
                const apontamentos = Array.isArray(apontamentosResponse.data) 
                    ? apontamentosResponse.data 
                    : apontamentosResponse.data?.apontamentos || [];


                const produtosAgregados = apontamentos.reduce((acc, apontamento) => {
                    const { peca, quantidade_injetada, pecas_nc } = apontamento;
                    if (!acc[peca]) {
                        acc[peca] = { totalInjetado: 0, totalPecasNC: 0 };
                    }
                    acc[peca].totalInjetado += Number(quantidade_injetada || 0);
                    acc[peca].totalPecasNC += Number(pecas_nc || 0);
                    return acc;
                }, {});

                const produtosCalculados = Object.keys(produtosAgregados).map(peca => {
                    const { totalInjetado, totalPecasNC } = produtosAgregados[peca];
                    const taxaNC = totalInjetado > 0 ? (totalPecasNC / totalInjetado) * 100 : 0;
                    return {
                        peca,
                        totalInjetado,
                        totalPecasNC,
                        taxaNC: parseFloat(taxaNC.toFixed(2))
                    };
                });
                setProductData(produtosCalculados);

                let totalPecasConformes = 0;
                let totalPecasNC = 0;

                apontamentos.forEach(ap => {
                    totalPecasConformes += (Number(ap.quantidade_injetada || 0) - Number(ap.pecas_nc || 0));
                    totalPecasNC += Number(ap.pecas_nc || 0);
                });

                const totalPecas = totalPecasConformes + totalPecasNC;
                const percentConformes = totalPecas > 0 ? (totalPecasConformes / totalPecas) * 100 : 0;
                const percentNC = totalPecas > 0 ? (totalPecasNC / totalPecas) * 100 : 0;

                if (totalPecas > 0) {
                    setPieChartData([
                        { name: 'Peças Conformes', value: totalPecasConformes, percent: percentConformes },
                        { name: 'Peças Não Conformes', value: totalPecasNC, percent: percentNC },
                    ]);
                } else {
                    setPieChartData([{ name: 'Nenhum dado disponível', value: 1, percent: 100 }]);
                }

                const employeeProductMap = {};
                apontamentos.forEach(ap => {
                    const funcionario = ap.funcionario;
                    const peca = ap.peca;
                    const quantidadeEfetiva = Number(ap.quantidade_efetiva || 0);
                    if (funcionario) {
                        if (!employeeProductMap[funcionario]) {
                            employeeProductMap[funcionario] = {};
                        }
                        if (!employeeProductMap[funcionario][peca]) {
                            employeeProductMap[funcionario][peca] = {
                                funcionario: funcionario,
                                peca: peca,
                                totalPecasEfetivas: 0,
                                totalPecasInjetadas: 0,
                                totalPecasNC: 0,
                                indice: 0
                            };
                        }
                        employeeProductMap[funcionario][peca].totalPecasEfetivas += quantidadeEfetiva;
                        employeeProductMap[funcionario][peca].totalPecasInjetadas += Number(ap.quantidade_injetada || 0);
                        employeeProductMap[funcionario][peca].totalPecasNC += Number(ap.pecas_nc || 0);
                    }
                });

                let processedEmployeeProductData = [];
                const allFuncs = [...new Set(apontamentos.map(ap => ap.funcionario))].filter(Boolean);
                allFuncs.forEach(func => {
                    if (filterEmployeeProductIndex === 'total') {
                        let totalInjetadas = 0;
                        let totalNC = 0;
                        let totalEfetivas = 0;

                        for (const prod in employeeProductMap[func]) {
                            totalInjetadas += employeeProductMap[func][prod].totalPecasInjetadas;
                            totalNC += employeeProductMap[func][prod].totalPecasNC;
                            totalEfetivas += employeeProductMap[func][prod].totalPecasEfetivas;
                        }
                        processedEmployeeProductData.push({
                            funcionario: func,
                            peca: 'Total',
                            totalPecasInjetadas: totalInjetadas,
                            totalPecasNC: totalNC,
                            totalPecasEfetivas: totalEfetivas,
                            indice: totalInjetadas > 0 ? ((totalEfetivas / totalInjetadas) * 100).toFixed(2) : 0
                        });
                    } else {
                        const productDataForFuncAndPeca = employeeProductMap[func]?.[filterEmployeeProductIndex];
                        if (productDataForFuncAndPeca) {
                            processedEmployeeProductData.push({
                                ...productDataForFuncAndPeca,
                                indice: productDataForFuncAndPeca.totalPecasInjetadas > 0 ? ((productDataForFuncAndPeca.totalPecasEfetivas / productDataForFuncAndPeca.totalPecasInjetadas) * 100).toFixed(2) : 0
                            });
                        } else {
                            processedEmployeeProductData.push({
                                funcionario: func,
                                peca: filterEmployeeProductIndex,
                                totalPecasInjetadas: 0,
                                totalPecasNC: 0,
                                totalPecasEfetivas: 0,
                                indice: 0
                            });
                        }
                    }
                });
                setEmployeeProductInjectionIndex(processedEmployeeProductData);

            } catch (err) {
                setError('Não foi possível carregar os dados. ' + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user && user.level >= 2) {
            fetchData();
        }
    }, [user, authLoading, navigate, filterEmployeeProductIndex, appliedFilters]);

    const handleDateChange = (event) => {
        const { name, value } = event.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const handleFilter = () => {
        setAppliedFilters(dateRange);
    };

    const handleFilterEmployeeProductIndexChange = (event) => {
        setFilterEmployeeProductIndex(event.target.value);
    };

    const handleSortEmployee = (column) => {
        if (sortColumnEmployee === column) {
            setSortDirectionEmployee(sortDirectionEmployee === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumnEmployee(column);
            setSortDirectionEmployee('desc');
        }
    };

    const handleSortProducts = (column) => {
        if (sortColumnProducts === column) {
            setSortDirectionProducts(sortDirectionProducts === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumnProducts(column);
            setSortDirectionProducts('desc');
        }
    };

    const handleChangePageProducts = (event, newPage) => {
        setPageProducts(newPage);
    };

    const handleChangeRowsPerPageProducts = (event) => {
        setRowsPerPageProducts(parseInt(event.target.value, 10));
        setPageProducts(0);
    };

    const sortedEmployeeProductData = useCallback(() => {
        let dataToSort = [...employeeProductInjectionIndex];
        if (filterEmployeeProductIndex !== 'total') {
            dataToSort = dataToSort.filter(item => item.peca === filterEmployeeProductIndex || (item.peca === 'Total' && filterEmployeeProductIndex === 'total'));
        }
        dataToSort.sort((a, b) => {
            let valA, valB;
            switch (sortColumnEmployee) {
                case 'totalInjetado':
                    valA = a.totalPecasInjetadas;
                    valB = b.totalPecasInjetadas;
                    break;
                case 'pecasNC':
                    valA = a.totalPecasNC;
                    valB = b.totalPecasNC;
                    break;
                case 'pecasEfetivas':
                    valA = a.totalPecasEfetivas;
                    valB = b.totalPecasEfetivas;
                    break;
                case 'indice':
                    valA = parseFloat(a.indice);
                    valB = parseFloat(b.indice);
                    break;
                default:
                    valA = a[sortColumnEmployee];
                    valB = b[sortColumnEmployee];
            }
            if (valA < valB) return sortDirectionEmployee === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirectionEmployee === 'asc' ? 1 : -1;
            return 0;
        });
        return dataToSort;
    }, [employeeProductInjectionIndex, filterEmployeeProductIndex, sortColumnEmployee, sortDirectionEmployee]);

    const sortedAndPaginatedProductData = useCallback(() => {
        const dataToSort = [...productData];
        dataToSort.sort((a, b) => {
            let valA, valB;
            switch (sortColumnProducts) {
                case 'totalInjetado':
                    valA = a.totalInjetado;
                    valB = b.totalInjetado;
                    break;
                case 'totalPecasNC':
                    valA = a.totalPecasNC;
                    valB = b.totalPecasNC;
                    break;
                case 'taxaNC':
                    valA = a.taxaNC;
                    valB = b.taxaNC;
                    break;
                default:
                    valA = a[sortColumnProducts];
                    valB = b[sortColumnProducts];
            }
            if (valA < valB) return sortDirectionProducts === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirectionProducts === 'asc' ? 1 : -1;
            return 0;
        });
        const startIndex = pageProducts * rowsPerPageProducts;
        const endIndex = startIndex + rowsPerPageProducts;
        return dataToSort.slice(startIndex, endIndex);
    }, [productData, pageProducts, rowsPerPageProducts, sortColumnProducts, sortDirectionProducts]);

    const getProductName = (pecaCodigo) => {
        const peca = pecasList.find(p => p.codigo_peca === pecaCodigo);
        return peca ? peca.descricao_peca : pecaCodigo;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            if (data.name === 'Nenhum dado disponível') {
                return (
                    <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}>
                        <Typography variant="body2">{data.name}</Typography>
                    </Paper>
                );
            }
            return (
                <Paper sx={{ p: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #ccc' }}>
                    <Typography variant="body2" sx={{ color: payload[0].color }}>{data.name}</Typography>
                    <Typography variant="body2">Quantidade: {data.value.toLocaleString('pt-BR')}</Typography>
                    <Typography variant="body2">Porcentagem: {data.percent.toFixed(2)}%</Typography>
                </Paper>
            );
        }
        return null;
    };

    if (authLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user || user.level < 2) {
        return (
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Alert severity="warning">Você não tem permissão para acessar esta página.</Alert>
            </Box>
        );
    }

    return (
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
                Análise de Qualidade por Produto
            </Typography>

            <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    label="Data Início"
                    name="start"
                    type="date"
                    value={dateRange.start}
                    onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: '180px' }}
                />
                <TextField
                    label="Data Fim"
                    name="end"
                    type="date"
                    value={dateRange.end}
                    onChange={handleDateChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: '180px' }}
                />
                <Button variant="contained" onClick={handleFilter} disabled={loading}>
                    {loading ? 'Filtrando...' : 'Filtrar'}
                </Button>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                    <Typography variant="h6" sx={{ ml: 2 }}>Carregando dados da qualidade...</Typography>
                </Box>
            ) : (
                <>
                    <Grid container spacing={3} sx={{flexGrow: 1, width: '100%'}}>
                        <Grid item xs={12} md={12}>
                            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 380 }}>
                                <Typography variant="h6" gutterBottom>
                                    índice NC
                                    ({moment(appliedFilters.start).format('DD/MM')} a {moment(appliedFilters.end).format('DD/MM')})
                                </Typography>
                                {pieChartData.length === 0 || (pieChartData.length === 1 && pieChartData[0].name === 'Nenhum dado disponível') ? (
                                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                                        <Typography variant="body1">Nenhum dado de produção para exibir no período.</Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 250 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    fill="#8884d8"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12}>
                            <Box elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 380, width: '100%', border: '1px solid #e0e0e0', borderRadius: '4px', boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)' }}>
                                <Typography variant="h6" gutterBottom>
                                    Taxa de Peças Não Conformes por Produto
                                </Typography>
                                <TableContainer sx={{ maxHeight: 250, overflowY: 'auto', mb: 1, width: '100%' }}>
    <Table size="small" stickyHeader>
        <TableHead>
            <TableRow>
                <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>Produto</TableCell>
                <TableCell align="right">
                    <TableSortLabel
                        active={sortColumnProducts === 'totalInjetado'}
                        direction={sortColumnProducts === 'totalInjetado' ? sortDirectionProducts : 'asc'}
                        onClick={() => handleSortProducts('totalInjetado')}
                    >
                        Total Injetado
                    </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                    <TableSortLabel
                        active={sortColumnProducts === 'totalPecasNC'}
                        direction={sortColumnProducts === 'totalPecasNC' ? sortDirectionProducts : 'asc'}
                        onClick={() => handleSortProducts('totalPecasNC')}
                    >
                        Peças Não Conformes
                    </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                    <TableSortLabel
                        active={sortColumnProducts === 'taxaNC'}
                        direction={sortColumnProducts === 'taxaNC' ? sortDirectionProducts : 'asc'}
                        onClick={() => handleSortProducts('taxaNC')}
                    >
                        Taxa de NC (%)
                    </TableSortLabel>
                </TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {sortedAndPaginatedProductData().length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} align="center">Nenhum dado de produto encontrado.</TableCell>
                </TableRow>
            ) : (
                sortedAndPaginatedProductData().map((item, index) => (
                    <TableRow
                        key={item.peca || `product-${index}`}
                        sx={{
                            backgroundColor: item.taxaNC > 7 ? '#FFEBEE' : 'inherit',
                            '&:hover': {
                                backgroundColor: item.taxaNC > 7 ? '#FFCDD2' : '#f5f5f5',
                            },
                        }}
                    >
                        <TableCell
                            sx={{
                                maxWidth: 400,
                                minWidth: 400,
                                whiteSpace: 'normal',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {getProductName(item.peca)}
                        </TableCell>
                        <TableCell align="right">{item.totalInjetado}</TableCell>
                        <TableCell align="right">{item.totalPecasNC}</TableCell>
                        <TableCell align="right" sx={{ color: item.taxaNC > 7 ? 'red' : 'inherit', fontWeight: item.taxaNC > 7 ? 'bold' : 'normal' }}>
                            {item.taxaNC}%
                        </TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
</TableContainer>

<TablePagination
    rowsPerPageOptions={[5, 10, 15, 25]}
    component="div"
    count={productData.length}
    rowsPerPage={rowsPerPageProducts}
    page={pageProducts}
    onPageChange={handleChangePageProducts}
    onRowsPerPageChange={handleChangeRowsPerPageProducts}
    labelRowsPerPage="Linhas por página:"
    labelDisplayedRows={({ from, to, count }) => {
        const totalPages = Math.ceil(count / rowsPerPageProducts);
        return `Página ${pageProducts + 1} de ${totalPages || 1}`;
    }}
    sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        '.MuiTablePagination-toolbar': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 2,
            minHeight: 48
        },
        '.MuiTablePagination-spacer': { display: 'none' },
        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows, .MuiTablePagination-select, .MuiTablePagination-actions': {
            display: 'flex',
            alignItems: 'center'
        }
    ,
                                        '.MuiTablePagination-selectLabel': {
                                            order: 1,
                                            marginRight: '8px',
                                            whiteSpace: 'nowrap',
                                            marginBottom: { xs: '8px', sm: '0px' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: 'auto',
                                        },
                                        '.MuiTablePagination-select': {
                                            order: 2,
                                            marginRight: { xs: '0px', sm: '24px' },
                                            marginBottom: { xs: '8px', sm: '0px' },
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: 'auto',
                                        },
                                        '.MuiTablePagination-actions': {
                                            order: 4,
                                            marginLeft: { xs: 0, sm: 2 },
                                        },
                                        '.MuiTablePagination-displayedRows': {
                                            order: 3,
                                            marginLeft: { xs: 0, sm: 'auto' },
                                            marginRight: { xs: 0, sm: 1 },
                                            whiteSpace: 'nowrap',
                                            marginBottom: { xs: '8px', sm: '0px' },
                                        },
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h4" gutterBottom>
                            Índice de Injeção por Funcionário e Produto
                        </Typography>
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom component="div" sx={{ mb: 0 }}>
                                        Desempenho por Funcionário e Produto
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <InputLabel id="filter-employee-product-label">Filtrar por Produto</InputLabel>
                                        <Select
                                            labelId="filter-employee-product-label"
                                            value={filterEmployeeProductIndex}
                                            label="Filtrar por Produto"
                                            onChange={handleFilterEmployeeProductIndexChange}
                                        >
                                            <MenuItem value="total">Todos os Produtos (Agregado)</MenuItem>
                                            {pecasList.map((peca) => (
                                                <MenuItem key={peca.codigo_peca} value={peca.codigo_peca}>
                                                    {peca.descricao_peca} ({peca.codigo_peca})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Funcionário</TableCell>
                                                {filterEmployeeProductIndex !== 'total' && <TableCell>Produto</TableCell>}
                                                <TableCell align="right">
                                                    Total Injetado
                                                    <IconButton size="small" onClick={() => handleSortEmployee('totalPecasInjetadas')}>
                                                        {sortColumnEmployee === 'totalPecasInjetadas' && sortDirectionEmployee === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell align="right">
                                                    Peças NC
                                                    <IconButton size="small" onClick={() => handleSortEmployee('totalPecasNC')}>
                                                        {sortColumnEmployee === 'totalPecasNC' && sortDirectionEmployee === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell align="right">
                                                    Peças Efetivas
                                                    <IconButton size="small" onClick={() => handleSortEmployee('totalPecasEfetivas')}>
                                                        {sortColumnEmployee === 'totalPecasEfetivas' && sortDirectionEmployee === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell align="right">
                                                    Índice Injeção (%)
                                                    <IconButton size="small" onClick={() => handleSortEmployee('indice')}>
                                                        {sortColumnEmployee === 'indice' && sortDirectionEmployee === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedEmployeeProductData().length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={filterEmployeeProductIndex !== 'total' ? 6 : 5} align="center">Nenhum dado de injeção por funcionário encontrado para o filtro selecionado.</TableCell>
                                                </TableRow>
                                            ) : (
                                                sortedEmployeeProductData().map((item, index) => (
                                                    <TableRow key={`${item.funcionario}-${item.peca || 'total'}-${index}`}>
                                                        <TableCell>{item.funcionario}</TableCell>
                                                        {filterEmployeeProductIndex !== 'total' && <TableCell>{getProductName(item.peca)}</TableCell>}
                                                        <TableCell align="right">{item.totalPecasInjetadas}</TableCell>
                                                        <TableCell align="right">{item.totalPecasNC}</TableCell>
                                                        <TableCell align="right">{item.totalPecasEfetivas}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: item.indice < 80 ? 'bold' : 'normal', color: item.indice < 80 ? 'orange' : 'inherit' }}>
                                                            {item.indice}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Box>
                </>
            )}
        </Box>
    );
}
