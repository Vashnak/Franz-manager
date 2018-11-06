export default {
  formatMetric(n) {
    const base = Math.floor(Math.log(Math.abs(n)) / Math.log(1000));
    const suffix = 'kmb'[base - 1];
    if (suffix) {
      let result = String(n / Math.pow(1000, base)).substring(0, 3);
      if (result[result.length - 1] === '.') {
        result = result.substring(0, result.length - 1);
      }
      return result + suffix;
    }
    return n;
  }
};
