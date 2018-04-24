export default {
    numberToScientistNotation(number, precision) {
        const n = Math.round(Math.log10(number));
        const m = (number * (Math.pow(10, Math.abs(n)))).toFixed(precision);
        return m.toString() + ' x 10<sup>' + n.toString() + '</sup>';
    }
};