Date.prototype.getWeek = function () {
    let firstOfJanuary = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - firstOfJanuary) / 86400000) + firstOfJanuary.getDay() + 1) / 7);
};

String.prototype.stripHTML = function(){
    let doc = new DOMParser().parseFromString(this, 'text/html');
    return doc.body.textContent || "";
};