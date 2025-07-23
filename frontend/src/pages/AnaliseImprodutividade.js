import React, { useState, useEffect } from 'react';
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
    Alert,
    CircularProgress,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    styled,
    useTheme 
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { BarChart, PieChart } from '@mui/x-charts';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import moment from 'moment';
import 'moment/locale/pt-br';
import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default function AnaliseImprodutividade() {
    const theme = useTheme(); 
    const [improdutividadeData, setImprodutividadeData] = useState([]);
    const [processedData, setProcessedData] = useState({});
    const [totalGeralPecasNC, setTotalGeralPecasNC] = useState(0);
    const [setores, setSetores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState(false);
    const [displayLimit] = useState(5);
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        selectedSetorId: ''
    });

    useEffect(() => {
        moment.locale('pt-br');
        fetchSetores();
        fetchImprodutividadeData();
    }, []);

    useEffect(() => {
        if (setores.length > 0) {
            const initialProcessedData = setores.reduce((acc, setor) => {
                acc[setor.nome_setor] = { totalPecas: 0, records: [] };
                return acc;
            }, {});

            const groupedData = improdutividadeData.reduce((acc, item) => {
                const setorNome = item.setores?.nome_setor || 'Setor Desconhecido';
                if (!acc[setorNome]) {
                    acc[setorNome] = { totalPecas: 0, records: [] };
                }
                acc[setorNome].totalPecas += item.pecas_transferidas;
                acc[setorNome].records.push(item);
                return acc;
            }, { ...initialProcessedData });

            Object.keys(groupedData).forEach(setorNome => {
                groupedData[setorNome].records.sort((a, b) => b.pecas_transferidas - a.pecas_transferidas);
            });

            const totalNC = improdutividadeData.reduce((sum, item) => sum + item.pecas_transferidas, 0);
            setProcessedData(groupedData);
            setTotalGeralPecasNC(totalNC);
        }
    }, [improdutividadeData, setores]);

    const fetchSetores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${REACT_APP_API_URL}/api/setores`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSetores(response.data);
        } catch (err) {
            setError('Erro ao carregar setores.');
        }
    };

    const fetchImprodutividadeData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const params = {
                dataInicio: filters.startDate ? moment(filters.startDate).format('YYYY-MM-DD') : undefined,
                dataFim: filters.endDate ? moment(filters.endDate).format('YYYY-MM-DD') : undefined,
                setorId: filters.selectedSetorId || undefined,
            };
            const response = await axios.get(`${REACT_APP_API_URL}/api/improdutividade/analise`, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setImprodutividadeData(response.data);
        } catch (err) {
            setError('Erro ao buscar dados de improdutividade. Tente novamente.');
            setImprodutividadeData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchImprodutividadeData();
    };

    const handleClearFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            selectedSetorId: ''
        });
        setTimeout(() => {
            fetchImprodutividadeData();
        }, 0);
    };

    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const globalSectorDistributionPieData = Object.entries(processedData)
        .filter(([, details]) => details.totalPecas > 0)
        .map(([setorName, details], index) => ({
            id: index,
            value: details.totalPecas,
            label: setorName,
        }));

    return (
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="pt-br">
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}> 
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    Análise de Improdutividade por Setor
                </Typography>

                <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}> 
                    <Typography variant="h6" gutterBottom>Filtros</Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Data Início"
                                value={filters.startDate}
                                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Data Fim"
                                value={filters.endDate}
                                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth sx={{ minWidth: 120 }}>
                                <InputLabel id="setor-filter-label">Setor</InputLabel>
                                <Select
                                    labelId="setor-filter-label"
                                    value={filters.selectedSetorId}
                                    label="Setor"
                                    onChange={(e) => handleFilterChange('selectedSetorId', e.target.value)}
                                >
                                    <MenuItem value=""><em>Todos os Setores</em></MenuItem>
                                    {setores.map((setor) => (
                                        <MenuItem key={setor.id} value={setor.id}>{setor.nome_setor}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" onClick={handleApplyFilters} disabled={loading} fullWidth sx={{ backgroundColor: theme.palette.primary.main }}>Aplicar</Button>
                            <Button variant="outlined" onClick={handleClearFilters} disabled={loading} fullWidth>Limpar</Button>
                        </Grid>
                    </Grid>
                </Paper>

                {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
                            <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                                Total de Peças Não Conformes por Setor
                            </Typography>
                            {Object.keys(processedData).length > 0 && totalGeralPecasNC > 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, width: '100%', maxWidth: '900px', margin: 'auto' }}>
                                    <BarChart
                                        series={[{
                                            data: Object.values(processedData).map(d => d.totalPecas),
                                            label: 'Peças Não Conformes',
                                            color: theme.palette.error.main, 
                                        }]}
                                        height={300}
                                        xAxis={[{ scaleType: 'band', data: Object.keys(processedData), labelStyle: { fill: theme.palette.text.primary }, tickLabelStyle: { fill: theme.palette.text.secondary } }]}
                                        yAxis={[{ labelStyle: { fill: theme.palette.text.primary }, tickLabelStyle: { fill: theme.palette.text.secondary } }]}
                                        margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
                                        sx={{
                                            '.MuiChartsAxis-line': {
                                                stroke: theme.palette.text.secondary,
                                            },
                                            '.MuiChartsAxis-tick': {
                                                stroke: theme.palette.text.secondary,
                                            },
                                            '.MuiChartsAxis-tickLabel': {
                                                fill: theme.palette.text.secondary,
                                            },
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Alert severity="info">Nenhum registro de não conformidade encontrado para os filtros selecionados.</Alert>
                            )}
                            <Typography variant="h6" align="center" sx={{ mt: 2, fontWeight: 'bold', color: theme.palette.text.primary }}>
                                Total Geral: {totalGeralPecasNC}
                            </Typography>
                        </Paper>

                        {Object.entries(processedData).sort((a, b) => b[1].totalPecas - a[1].totalPecas).map(([setorNome, details]) => {
                            const percentageOfTotalNC = totalGeralPecasNC > 0 ? (details.totalPecas / totalGeralPecasNC) * 100 : 0;
                            if (details.totalPecas === 0) return null;

                            const chartColors = [
                                theme.palette.primary.light,
                                theme.palette.secondary.light,
                                theme.palette.info.main,
                                theme.palette.warning.main,
                                theme.palette.success.main,
                                theme.palette.error.main,
                            ];

                            return (
                                <Accordion
                                    key={setorNome}
                                    expanded={expanded === setorNome}
                                    onChange={handleAccordionChange(setorNome)}
                                    sx={{ mb: 2, borderRadius: '12px', '&:before': { display: 'none' } }}
                                    elevation={3}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />}
                                        sx={{ '&:hover': { backgroundColor: theme.palette.action.hover }, p: '12px 24px' }}
                                    >
                                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500, color: theme.palette.text.primary }}>{setorNome}</Typography>
                                        <Typography sx={{ color: theme.palette.text.secondary, alignSelf: 'center', fontWeight: 'bold' }}>
                                            {details.totalPecas} peças NC ({percentageOfTotalNC.toFixed(1)}% do total)
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 3, backgroundColor: theme.palette.background.paper }}> 
                                        <Grid container spacing={4} alignItems="center">
                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                                                    Distribuição Percentual
                                                </Typography>
                                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                                    <PieChart
                                                        series={[{
                                                            data: globalSectorDistributionPieData,
                                                            innerRadius: 40,
                                                            outerRadius: 100,
                                                            paddingAngle: 2,
                                                            cornerRadius: 5,
                                                            highlightScope: { faded: 'global', highlighted: 'item' },
                                                            faded: { innerRadius: 30, additionalRadius: -10, color: 'gray' },
                                                            arcLabel: (item) => `${(item.value / totalGeralPecasNC * 100).toFixed(1)}%`,
                                                        }]}
                                                        height={300}
                                                        colors={chartColors} 
                                                        slotProps={{
                                                            legend: {
                                                                direction: 'row',
                                                                position: { vertical: 'bottom', horizontal: 'middle' },
                                                                padding: 0,
                                                                labelStyle: { fill: theme.palette.text.primary },
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            </Grid>

                                            <Grid item xs={12} md={6}>
                                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                                                    Maiores Registros de Não Conformidade (Top {displayLimit})
                                                </Typography>
                                                <TableContainer component={Paper} variant="outlined" sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary }}>
                                                    <Table size="small" aria-label={`registros de ${setorNome}`}>
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                                                                <TableCell sx={{ color: theme.palette.text.primary }}>Data</TableCell>
                                                                <TableCell sx={{ color: theme.palette.text.primary }}>Hora</TableCell>
                                                                <TableCell align="right" sx={{ color: theme.palette.text.primary }}>Peças NC</TableCell>
                                                                <TableCell sx={{ color: theme.palette.text.primary }}>Causa</TableCell>
                                                                <TableCell sx={{ color: theme.palette.text.primary }}>Usuário</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {details.records.slice(0, displayLimit).map((rec) => (
                                                                <StyledTableRow key={rec.id}>
                                                                    <TableCell sx={{ color: theme.palette.text.secondary }}>{moment(rec.data_improdutividade).format('DD/MM/YYYY')}</TableCell>
                                                                    <TableCell sx={{ color: theme.palette.text.secondary }}>{rec.hora_improdutividade}</TableCell>
                                                                    <TableCell align="right" sx={{ color: theme.palette.text.secondary }}>{rec.pecas_transferidas}</TableCell>
                                                                    <TableCell sx={{ color: theme.palette.text.secondary }}>{rec.causa || 'N/A'}</TableCell>
                                                                    <TableCell sx={{ color: theme.palette.text.secondary }}>{rec.usuario_registro}</TableCell>
                                                                </StyledTableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Grid>
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </>
                )}
            </Box>
        </LocalizationProvider>
    );
}