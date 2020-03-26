class Class
{
    constructor(arr)
    {
        arr = arr.map(it => it.stripHTML());
        [this.classOrder, this.time, this.name, this.lector, this.groups, this.classPeriod] = arr;
    }
}