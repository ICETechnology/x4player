<template>
    
</template>
<script>
export default {
    data() {
        return {
			// 遞迴計數器
			delayCount: 0,
			// 遞迴限值
			maxDelayCount: 5,
		}
    },
    beforeMount() {
		// 有排序且是商品行情列表
		if(this.sortBy) {
			this.status = "QUERY";
			this.restoreMkt();
			this.delayForMKT();
		}
		else {
			this.sortedList = this.expandObjList;
		}
	},
    mounted() {},
    methods: {
		onSort(obj){
			if(!this.column) {
				// 點同欄位切換排序方式
				if(this.sortKey !== '' && this.sortKey == obj.key) {
					// 順序 -> 倒序
					if(this.sortBy == "asc")
						this.sortBy = "desc";
					// 倒序 -> 還原
					else {
						this.sortKey = "";
						this.sortBy = "";
						this.sortedList = this.expandObjList;
						return;
					}
				}
				// 切換欄位排序
				else {
					this.sortKey = obj.key;
					this.sortBy = "asc";
				}
				this.status = "QUERY";
				this.delayForMKT();
			}
		},
        restoreMkt() {
			let sidList = [];
			// 各商品取得市況
			this.expandObjList.forEach(obj=>{
				obj["$qo"] = M4C.Quote.getQuoteObject(obj.sid);
				sidList.push(M4C.Symbol.toMonthSymbol(obj.sid));
			});
			// 回補全部商品市況
			M4C.Quote.rcvMkt(sidList);
		},
        // 遞迴等市況好再處理排序。
		delayForMKT() {
			let self = this;
			let lastItem = this.expandObjList.slice(-1)[0];
			// 以最後一項商品的市況做判斷是否不用回補，直接排序。
			if(this.expandObjList.length && lastItem['$qo'] && lastItem['$qo'].sn) {
				console.time('delayForMKT sort');
				this.sortedList = this.$sortSymbolList(this.expandObjList, this.sortBy, this.sortKey);
				console.timeEnd('delayForMKT sort');
				this.status = "DONE";
				return;
			}
			// 沒市況則回補市況
			else if(this.expandObjList.length && !lastItem['$qo'] ){
				this.restoreMkt();
			}
			
			setTimeout(() => {
				this.delayCount ++;
				// console.log("delayForMKT count", this.delayCount);
				let list = self.$sortSymbolList(self.expandObjList, self.sortBy, self.sortKey);
				let count = 0;
				// 根據sn判斷是否有回補到市況並加計
				list.forEach(obj=>{
					if(obj.$qo && obj.$qo.sn!=="") count++;
				});
				// 全部市況已取得或已500ms就強制結束以目前取得的市況排序顯示
				if(count === list.length || self.delayCount == self.maxDelayCount){
					self.sortedList = list;
					self.status = "DONE";
					self.delayCount = 0;
				}
				// 重新等待市況回補完成
				else self.delayForMKT();
			}, 100);
		},
    },
    watch: {
		// 當有變動時調整sortedList
		expandObjList(nv) {
			// 以sid判斷是否需要回補及排序
			if(nv[0] && nv[0].sid && this.sortKey){
				this.restoreMkt();
				this.delayForMKT();
			}
			// 沒資料時重設清單。
			else if(!nv.length) {
				this.sortedList = [];
			}
			// 更新清單。
			else {
				this.sortedList = nv;
			}
		},
		// 當切換交易所時調整sortedList
		"$store.state.status.quoteTabID"(nv, ov){
			if(this.sortKey){
				this.restoreMkt();
				this.delayForMKT();
			}
		}
    },
    computed: {
		/** 顯示欄位列表 */
		showList() {
			if(this.column) return this.column;
			else
				return this.$store.state.columnSD.quote_tablex.show;
		},
		// 排序欄位
		sortKey: {
			get(){return this.$store.state.tableX.sortKey;},
			set(v) {
				this.$store.state.tableX.sortKey = v;
			}
		},
		// 排序方式
		sortBy: {
			get() {return this.$store.state.tableX.sortBy;},
			set(v) {
				this.$store.state.tableX.sortBy = v;
			}
		},
        // 合約列表排序功能
		$sortSymbolList() {return  this.$store.state.fn.$sortSymbolList;},
    },

}
</script>