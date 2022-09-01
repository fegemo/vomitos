function getCells(line) {
    return line.split(';')
}

export default function(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '').map(getCells)
    const [header, ...rows] = lines

    return rows.map(r => r.reduce((accum, cellValue, j) => {
        const columnName = header[j]
        accum[columnName] = cellValue
        return accum
    }, {}))
}