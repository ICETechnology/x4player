<template>
    <div class="mix-order-ctn flex-col">
    	<!-- 單列資金 -->
		<MarginMini class="margin-mini bgc-orange pdlr3 pdtb1d5" uiStyle="2" />
        <TabGroup class="mix-order-tab-group" ref="mix-order-tg" :selectedIdx="0" tabKey="mix-order" disablePrevNext="true"
            :hiddenTab="tabList.length == 1" :tabList="tabList"/>
    </div>
</template>
<script>
import ABOrder from "@/components/ABOrder.vue";
export default {
	props: ["suspend", "param"],
	data() {
		return {
            /** 交易版面顯示那些功能元件 */
            defaultTabList: [
                // 一般出金
                {label: "下单盒", comClass: "FloatOrder", param: this.param},
                // 幣別互轉
                {label: "触A下B", comClass: ABOrder},
            ],
        }
	},
	beforeMount() {},
    mounted() {
        let self = this;
        this.updateTitle();
        // 收到發送委託
		eventBus.$on("SEND-ORDER", (rpt)=>{
            // 依據設定決定重設手數或委託價(只針對下單盒處理)
            if(self.$store.state.order.resetQty)
                self.$store.state.order.inputOrderQty = "";
            if(self.$store.state.order.resetPrice && self.$store.state.order.inputOrderPrice && self.orderBoxMode == 1)
                self.$store.state.order.inputOrderPrice = "";
		});
    },
	beforeDestroy() {},
	components: {ABOrder},
    methods:{
        updateTitle() {
			this.$emit('title', this.orderBoxMode === 1 ? '高级下单盒' : '下单盒');
		},
    },
	watch: {
        orderBoxMode() {
			this.updateTitle();
		},
    },
    computed: {
        // 下單盒模式 (0:普通, 1:高級)
		orderBoxMode() {
			return this.$store.state.config.orderBoxMode;
		},
        tabList() {
            if(!this.enableABOrder)
                return this.defaultTabList.slice(0, 1);
            else
                return this.defaultTabList;
        },
        // 當前交易帳號的pdsetting
		acPdSetting() {
			return this.$store.state.config.tradePdSetting;
		},
        // 啟用觸A下B功能
        enableABOrder() {
            try {
                // pdSetting有設定顯示且不隱藏SMO
                return this.acPdSetting.broker.enableABOrder && !this.hiddenSMO;
            }
            catch(e) {}
        },
		/** 是否隱藏SMO相關功能(By pdsetting) */
		hiddenSMO() {
            try {return this.$store.state.config.quotePdSetting.function.hiddenSMO;}
            catch(e) {}
        },
    }
}
</script>