class Class
{
    classOrder;
    time;
    name;
    lecturer;
    groups;
    classPeriod;
    constructor(arr)
    {
        arr = arr.map(it => it.stripHTML());
        [this.classOrder, this.time, this.name, this.lecturer, this.groups, this.classPeriod] = arr;
    }

    toArray()
    {
        return [ this.time, this.name, this.lecturer, this.groups];
    }
}