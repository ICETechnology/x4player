/***********************************************************
* Array
***********************************************************/
/**
 * 將陣列裡指定 idx 的元素移動到陣列裡新的位置
 */
Array.prototype.move = function(from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
};