Date.prototype.getWeek = function () {
    let firstOfJanuary = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - firstOfJanuary) / 86400000) + firstOfJanuary.getDay() + 1) / 7);
};