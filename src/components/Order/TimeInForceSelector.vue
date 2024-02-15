<template>
	<SingleSelect class="w100p" :options="tifOptions" v-model="$store.state.order.inputTimeInForce"/>
</template>

<script>
export default {
	props: ['symbol'],
	data() {
		return {
		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {},
	watch: {
		// 效期別內容異動
		tifOptions(nv) {
			this.$nextTick(()=>{
				// console.log(JSON.stringify(nv.map(o=>o.label)));
				// 各委託別預設希望在哪個效期別 (會先檢查當前 tifOptions 有包含該 tif 才會設定)
				switch(this.orderType) {
					case "LIMIT":
					case "STPLMT":
						if (nv.find(o=>o.value==="ROD"))
							this.$order.inputTimeInForce = "ROD";
						break;
					case "MARKET":
					case "STOP":
					case "MWP":
						if (nv.find(o=>o.value==="IOC"))
							this.$order.inputTimeInForce = "IOC";
						break;
				}				
			});
		}
	},
    computed: {
		sid() {return this.symbol || this.$store.state.selectedSymbol.ID;},
		$order() {
			return this.$store.state.order;
		},
		// 委託別
		orderType() {
			return this.$store.state.order.orderType;
		},
		brokerID() {
			return this.$store.state.login.brokerID;
		},
		brokerInfo() {
			return this.$store.state.brokerMap[this.brokerID] || {};
		},
		brokerSystem() {
			return this.$store.state.order.orderTypeFromDCore ? 'DCORE' : this.brokerInfo.system || 'default';
		},
		// 交易所層級的總表
		exgOrderTypes() {
			try{return M4C.Symbol.getMainformInfo(this.sid.split('.').slice(0,3).join('.')).OrderTypes;}catch(e){return {};}
		},
		// 效期別選項
        tifOptions() {
            // 以 UFX 為例，若 OrderTypes.UFX 不存在時，使用 OrderTypes.default
			let odObjList = this.exgOrderTypes[this.brokerSystem] || this.exgOrderTypes.default;
			if (Array.isArray(odObjList)) {
				let odObj = odObjList.find(od => od.name===this.orderType);
				if (odObj && odObj.types) {
					return odObj.types.map(tif => {return {label: tif, value: tif};});
				}
            }
            // 無法從總表取得設定時，返回預設值 ROD/IOC/FOK
            return [
                {label: 'ROD', value: 'ROD'},
                {label: 'IOC', value: 'IOC'},
                {label: 'FOK', value: 'FOK'},
			];
        },
	},
}
</script>

<style scoped>
</style>