import parseCsv from "./parse-csv.js";
import { toHuman } from "./human-time.js";

const rawData = await fetch('episodios-de-vomito.csv').then(r => r.text())
const data = parseCsv(rawData).map(row => {
    const splitRawDate = row['Data'].split('/')
    const splitRawTime = row['Horário'].split(':')
    return {
        x: new Date([1, 0, 2].map(j => splitRawDate[j]).join('/')),
        y: +splitRawTime[0] + splitRawTime[1] / 60,
        'Data': row['Data'],
        'Horário': row['Horário'],
        'Queixa': row['Queixa'],
        'Local': row['Local'],
        'Saliva grossa': row['Saliva grossa'],
        'Catarro': row['Catarro'],
        'Tontura': row['Tontura'],
        'Sufocamento': row['Sufocamento'],
        'Preocupação': row['Preocupação'],
        'Ansiosa': row['Ansiosa'],
        'Nariz entupido': row['Nariz entupido'],
        'Nariz sangrando': row['Nariz sangrando'],
        'Nojo': row['Nojo'],
        'Refluxo': row['Refluxo'],
        'Azia': row['Azia'],
        'Última refeição': row['Tempo desde refeição'],
        'Alívio': row['Alívio'],
        'Resultado do alívio': row['Resultado do alívio']
    }
})
const yesNoFields = ['Saliva grossa', 'Catarro', 'Tontura', 'Sufocamento', 'Ansiosa', 'Nariz entupido', 'Nariz sangrando', 'Nojo', 'Refluxo', 'Azia']


const onlyQueixas = queixas => data.filter(row => queixas.includes(row['Queixa']))
const barSeries = (results, yesOrNo) => yesNoFields.map(characteristic => onlyQueixas(results).filter(row => row[characteristic] === yesOrNo).length)


const individualFeaturesChart = Highcharts.chart('caracteristicas-individuais', {
    chart: {
        type: 'column'
    },
    title: {
        text: 'Frequência de características nos episódios'
    },
    xAxis: {
        categories: yesNoFields
    },
    yAxis: {
        min: 0,
        title: {
            text: 'Episódios de vômito'
        }
    },
    legend: {
        floating: true,
        x: -10,
        y: 50,
        align: 'right',
        verticalAlign: 'top',
        backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
        borderWidth: 1
    },
    tooltip: {
        // headerFormat: '<b>{column}</b><br>',
        pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>',
        shared: true
    },
    plotOptions: {
        column: {
            stacking: 'percent'
        }
    },
    series: [
        {
            name: 'Não',
            data: barSeries(['vômito'], 'não'),
            color: 'silver'
        },
        {
            name: 'Sim',
            data: barSeries(['vômito'], 'sim'),
            color: 'cornflowerblue'
        }
    ]
});


const wheelSeries = results => yesNoFields.slice(0, -1).map((characteristic, i) => yesNoFields.filter((_, j) => i < j).map(innerCharacteristic => ({from: characteristic, to: innerCharacteristic, weight: onlyQueixas(results).filter(row => row[characteristic] === 'sim' && row[innerCharacteristic] === 'sim').length / onlyQueixas(results).length}))).reduce((prev, curr) => prev.concat(curr), [])

const featureCorrelationChart = Highcharts.chart('correlacao-das-caracteristicas', {
    title: {
        text: 'Correlação entre características'
    },

    accessibility: {
        point: {
            valueDescriptionFormat: '{index}. From {point.from} to {point.to}: {point.weight}.'
        }
    },

    tooltip: {
        pointFormatter() {
            return `${this.from} ↔️ ${this.to}: ${(100*this.weight).toFixed(0)}%`
        },
        nodeFormatter() {
            return `${this.name}`
        }
    },

    series: [{
        keys: ['from', 'to', 'weight'],
        data: wheelSeries('vômito'),
        type: 'dependencywheel',
        name: 'Características',
        dataLabels: {
            color: '#333',
            style: {
                textOutline: 'none'
            },
            textPath: {
                enabled: true,
                attributes: {
                    dy: 5
                }
            },
            distance: 10
        },
        size: '95%'
    }]

});




const punchCardVomitSeries = data.filter(row => row['Queixa'] === 'vômito')
const punchCardAnsiaSeries = data.filter(row => row['Queixa'] === 'ânsia')
const punchCardGolfSeries = data.filter(row => row['Queixa'] === 'golfada')

Highcharts.chart('cartao-perfurado', {
    chart: {
        type: 'scatter',
        zoomType: 'xy',
        events: {
            load() {
                const chart = this
                const plotBands = []
                let plotBandConfig = {
                    color: '#e8ff71',
                };

                const initialDay = chart.series.reduce((minSoFar, series) => {
                    const minInSeries = series.points.reduce((minInSeriesSoFar, point) => point.x < minInSeriesSoFar ? point.x : minInSeriesSoFar, minSoFar)
                    return minInSeries
                }, new Date(2100, 0, 1))
                const lastDay = chart.series.reduce((maxSoFar, series) => {
                    const maxInSeries = series.points.reduce((maxInSeriesSoFar, point) => point.x > maxInSeriesSoFar ? point.x : maxInSeriesSoFar, maxSoFar)
                    return maxInSeries
                }, new Date(1900, 0, 1))

                for (let day = new Date(initialDay.valueOf()); day <= lastDay; day.setDate(day.getDate() + 1)) {
                    if (day.getDay() === 6) {
                        plotBandConfig.from = new Date(day.valueOf())
                    } else if (day.getDay() === 0) {
                        plotBandConfig.to = new Date(day.valueOf())
                    } else if (day.getDay() === 1) {
                        plotBands.push(plotBandConfig)
                        plotBandConfig = {
                            color: '#e8ff71',
                        };
                    }

                }

                chart.xAxis[0].update({
                    plotBands
                })
            },

            render() {
                const visibleSeries = this.series.filter(s => s.visible).map(s => s.name.toLowerCase())
                individualFeaturesChart.series[0].update({
                    data: barSeries(visibleSeries, 'não')
                }, false)
                individualFeaturesChart.series[1].update({
                    data: barSeries(visibleSeries, 'sim')
                }, true)
                featureCorrelationChart.series[0].update({
                    data: wheelSeries(visibleSeries)
                }, true)
            }
        }
    },
    title: {
        text: 'Episódios por dia/horário'
    },
    data: {
        csvURL: 'episodios-de-vomito.csv'
    },
    xAxis: {
        title: {
            enabled: true,
            text: 'Data'
        },
        type: 'datetime'
    },
    yAxis: {
        title: {
            text: 'Horário'
        },
        min: 0,
        max: 23,
        tickAmount: 4,
        labels: {
            formatter() {
                return `${this.value}:00`
            }
        }
    },
    legend: {
        backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
        borderWidth: 1
    },
    plotOptions: {
        scatter: {
            marker: {
                radius: 5,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)'
                    }
                }
            },
            states: {
                hover: {
                    marker: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormatter() {
                    const templateStart = `Local: <b>${this['Local']}</b><br>🕑: ${this['Data'].substr(0, 5)} ${this['Horário']}<br><br>`
                    const templateMid = yesNoFields.map(field =>
                        `${field}: ${this[field] === 'sim' ? '✔️' : (this[field] === 'não' ? '❌' : '⚠️')}<br>`).join('')
                    const templateEnd = `Última refeição: ${toHuman(this['Última refeição'])}<br>`
                    return templateStart + templateMid + templateEnd
                }
            }
        }
    },
    series: [{
        name: 'Vômito',
        color: 'rgba(223, 83, 83, .85)',
        data: punchCardVomitSeries
    },
    {
        name: 'Golfada',
        color: 'rgba(223, 183, 23, .85)',
        data: punchCardGolfSeries
    },
    {
        name: 'Ânsia',
        color: 'rgba(123, 83, 83, .85)',
        data: punchCardAnsiaSeries
    }]
}
);


const mainEl = document.querySelector('main')
document.body.ondblclick = () => {
    if (!document.fullscreenElement) {
        mainEl.requestFullscreen()
    } else {
        document.exitFullscreen();
    }
}