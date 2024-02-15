<template>
    <div class="aborder-ctn flex-col pdtb5 pdlr4">
        <div class="order-condition-ctn flex-col flex-1 posr clr-white">
            <ScrollBounce v-stop-propagation-y>
                <!-- 商品搜尋 -->
                <SymbolSearch class="symbol-search setting-line" v-model="symbolA" isStopSub="true" />
                <!-- 合约切换 -->
                <ContractsSwitch :preSidList='sidList' v-model="symbolA" class="setting-line font-size-mini clr-gray" v-if="sidList.length > 1" />
                <div class="symbolA-condition-info flex-row">
                    <!-- 左邊操作項目 -->
                    <div class="left-ctn flex-col flex-1">
                        <!-- 報價-最新價 -->
                        <div class="flex-row flex-start price-ctn setting-line space-between mglr2">
                            <span class="title clr-0C7EC8">{{$ln('最新价')}}</span>
                            <span class="underline">{{$symbolPrice(sid, $qoPrice)}}</span>
                        </div>
                        <!-- 觸發控制選項 -->
                        <div class="setting-line">
                            <SingleSelect :options="optCompareList" v-model="compare" />
                        </div>
                    </div>
                    <!-- 右邊操作項目 -->
                    <div class="right-ctn flex-col flex-1 mgl2" :class="[isDenoA?'flex-bottom':'col-reverse']">
                        <!-- 觸發價格 -->
                        <div class="setting-line">
                            <InputPrice v-model.number="trgPrice" :label="$ln(`价格`)" />
                        </div>
                    </div>
                </div>
                <div class="title flex-start clr-0C7EC8 setting-line mgl2 mgt1">{{$ln('委托')}}</div>
                <OrderCondition class="flex-col space-between" mode='1' :propSid="symbolB"/>
            </ScrollBounce>
        </div>
        <!-- GTD警示訊息 -->
        <div v-if="displayGTDWarring" class="gtd-warring-ctn mgtb3 word-break-all overflow-y-auto" v-stop-propagation-y>
            <div v-html="GTDWarring"/>
        </div>
        <div class="aborder-foot flex-center pdb5 posr">
            <!-- 委託按鈕 -->
			<OrderBtn class="mgb5 hidden" :param="param" :useComName="selfComName" ref="orderBtn" />
			<Button class="pdlr3 bgc-0065A4 clr-white flex-1 mgl2" :class="{'disabled': !isEnableSubmit || isOnSubmit, 'disabled-ui': !isAgreeSMO}" @click="onSubmit()">{{$ln(`送出条件单`)}}</Button>
            <loadingIcon class="flex-start clr-white" v-if="isOnSubmit" />
		</div>
    </div>
</template>
<script>
import SymbolSearch from '@/components/SymbolSearch';
import ContractsSwitch from "@/components/ContractsSwitch.vue";
import QuoteAgent from '@/components/QuoteAgent';
import OrderBtn from "@/components/Order/OrderBtn.vue";
import OrderCondition from "@/components/Order/OrderCondition.vue";

export default {
    mixins: [QuoteAgent],
    data() {
        return {
            /** 觸發A商品代碼 */
            symbolA: "",
            /** 觸發比較 */
            compare: "=",
            /** 觸發價格 */
            trgPrice: "",
            /** 觸發比較選擇清單 */
            optCompareList: [
                {label: '大於', value: '>'},
                {label: '大於等於', value: '>='},
                {label: '等於', value: '='},
                {label: '小於等於', value: '<='},
                {label: '小於', value: '<'},
            ],
            /** 觸A下B委託結果 */
            ABOrderResult: {},
            quoteObjectB: {},
        }
    },
    props: ['suspend'],
    components: {
        SymbolSearch,
        ContractsSwitch,
        OrderBtn,
        OrderCondition
    },
    beforeDestroy() {
        if(this.symbolB)
            M4C.Quote.unsub(this.symbolB, this);
    },
    mounted() {
        let self = this;
        // 指定A商品為當前關注商品
        this.symbolA = this.$store.state.selectedSymbol.ID;
        // 指定觸發價為當前關注商品的最新價
        this.trgPrice = this.$qoPrice;
        // 指定委託按鈕(取orderInfo用)
        this.orderBtn = this.$refs.orderBtn;
        // 清空B商品
        this.$store.state.order.symbolB = "";
        // 清空委託方向
        this.$store.state.order.side = "";
        // 收到發送委託
		eventBus.$on("SEND-ORDER", (rpt)=>{
            // 沒有B商品時不處理
            if(!self.quoteObjectB.sn) return;
            // 依據設定決定重設買賣方向、手數、觸發價、委託價
            if(self.$store.state.order.resetBS)
                self.$store.state.order.side = "";
            if(self.$store.state.order.resetQty)
                self.$store.state.order.inputOrderQty = "";
            if(self.$store.state.order.resetPrice) {
                self.trgPrice = "";
                self.$store.state.order.inputOrderPrice = "";
            }
        });
    },
    methods: {
        onSubmit() {
            // 沒有確認雲端洗價同意書時不執行, 並彈出是否執行同意確認說明。
            if(!M4C.SmoAgreement.checkAgreeSMO(true)) return;
            let oi = this.orderBtn.getOrderInfo(this.side, null, null, null);
            // 當取不到委託資訊時不處理
            if(!oi) return;
            // 指定委託商品為B商品
            oi.SYMBOL = M4C.Symbol.toMonthSymbol(this.symbolB);
            // 指定觸A下B為DCore洗價
            oi.SMO_TYPE = 'SMO';
            // 指定觸A下B為開倉
            oi.POSITION_EFFECT = this.twMode? "AUTO": "OPEN";
            // 指定洗價商品相關設定
            oi.MARKET_WATCH = this.marketWatchInfo;
            console.log("ABOrder orderInfo is: ", oi);
            //是否跳出確認視窗
			if (this.$store.state.order.confirm){
				// 提示确认视窗
				eventBus.$emit("POPUP-DIALOG", 'OrderConfirm', {orderInfo: oi}, {transName: 'float'});
			}
			else {
				M4C.Order.sendOrder(oi);
				// 關閉自己
				// eventBus.$emit("CLOSE-FLOAT-DIALOG");
			}
        },
        onChange() {
            this.$store.state.order.inputStopPrice = this.$store.state.order.inputTouchPrice = this.$store.state.order.inputOrderPrice = "";
            this.orderBtn.onOrderType(this.orderType);
        },
    },
    watch: {
        suspend(nv) {
            if(!nv){
                this.symbolA = this.$store.state.selectedSymbol.ID;
                this.trgPrice = this.$qoPrice;
            }
        },
        // 觸A商品變動
        symbolA(nv) {
            this.trgPrice = '';
            this.$store.commit("setSelectedSymbol", nv);
        },
        // 下B商品變動
        symbolB(nv, ov) {
            console.log('symbolB change', nv , ov)
            M4C.Quote.unsub(ov, this);
            M4C.Quote.sub(nv, this);
            this.quoteObjectB = M4C.Quote.getQuoteObject(nv);
            // 設定最低委託數量
            if(this.isStock)
                this.$store.state.order.inputOrderQty = this.$store.state.order.stkQty;
            else if(this.isFut)
                this.$store.state.order.inputOrderQty = this.$store.state.order.futQty;
            else if(this.isOpt)
                this.$store.state.order.inputOrderQty = this.$store.state.order.optQty;
        },
        // A商品現價變動
        $qoPrice(nv) {
            if(this.trgPrice == '')
                this.trgPrice = nv;
        },
        // B商品現價變動
        $qoPriceB(nv, ov) {
            if(nv && !ov){
                this.onChange();
            }
        }
    },
    computed: {
		$symbolPrice() {return this.$store.state.fn.$symbolPrice;},
        // 監看的商品代碼
        sid() {return this.symbolA;},
        // 委託的商品代碼
        symbolB() {return this.$store.state.order.symbolB;},
        // 委託方向
        side() {return this.$store.state.order.side;},
        // 可切換的清單
        sidList() {
            if( this.sid.split('.')[1] == 'O')
                return this.optContracts || this.curContractsList;
            else if( this.sid.split('.')[1] == 'F')
                return this.futContracts || this.curContractsList;
            else return this.curContractsList;
        },
        // 依代碼判斷商品是否為個股
        isStock() {return this.symbolB? this.symbolB.split('.')[1] == 'S': false;},
        // 依代碼判斷商品是否為期貨
        isFut() {return this.symbolB? this.symbolB.split('.')[1] == 'F': false;},
        // 依代碼判斷商品是否為選擇權
        isOpt() {return this.symbolB? this.symbolB.split('.')[1] == 'O': false;},
        $qoPriceB() {
            if(this.quoteObjectB.sn)
                return this.quoteObjectB.p || this.quoteObjectB.r || this.quoteObjectB.pc;
        },
        mapSymbolContracts() {return M4C.Symbol.mapSymbolContracts;},
        // 依代碼找商品的合約清單(期貨)
		futContracts() {
            // 轉成熱門月代碼
			let tmp = this.symbolA.split('.');
				tmp.splice(-1,1);
				tmp.push('HOT');
			// 轉成熱門月月份代碼
			let symbol = M4C.Symbol.toMonthSymbol(tmp.join('.'));
			return this.mapSymbolContracts[symbol];
		},
        // 選擇權履約價清單
        optContracts() {
            try {
                return M4C.Symbol.getStrikePriceList(this.symbolA);
            } catch(e) {return [];}
        },
        // 當前關注合約列表
		curContractsList() {
			return this.$store.state.status.curContractsList;
		},
        // 送出按鈕是否有效
        isEnableSubmit() {
            return this.side && this.symbolA && this.symbolB && this.trgPrice != "";
        },
        // 觸A的觸發相關設定(目前依設計只需一組條件，如需多組再做調整)。
        marketWatchInfo() {
            // 設定資訊(由於server指定這個欄位為陣列。因此，另外包一層。)
            let info = [{
                'SYMBOL': M4C.Symbol.toMonthSymbol(this.symbolA),         // 觸發條件的商品代碼
                'CONDITION': this.compare,      // 觸發條件的控制
                'PRICE': this.trgPrice,         // 觸發條件的價格
            }]
            return info;
        },
        /** 是否顯示 loading-icon (發出申請)*/
		isOnSubmit() {
			if (this.ABOrderResult.$STATUS === "QUERY")	return true;
			return false;
		},
        // 當前組件名稱
		selfComName() {return M4C.Analysis.getComponentClassName(this);},
        orderType() {
			return this.$store.state.order.orderType;
		},
        /** 帶給orderBtn的參數 */
        param() {
            // 設定高級下單盒模式且是委託商品B
            return {orderBoxMode: 1, symbol: this.symbolB};
        },
        /** 是否有簽署雲端條件單同意書 */
		isAgreeSMO() {
			return M4C.SmoAgreement.checkAgreeSMO();
		},
        isDenoA() {
            return M4C.Symbol.getDenoObject({sid: this.sid, val: this.$qoPrice});
        },
        // GTD警示訊息(由pdsetting提供)
		GTDWarring() {try {
			return this.$store.state.config.publicPdSetting.GTDWarring;} catch(e) {}},
		// 是否顯示GTD警示訊息(有設定訊息及效期別是GTD)
		displayGTDWarring() {return this.GTDWarring && this.$store.state.order.inputTimeInForce === "GTD";},
        twMode() {return this.$store.state.config.twMode;},
	},
}
</script>
<style scoped>
.clr-0C7EC8 {color: #0C7EC8}
.left-ctn .focus {background-color: #FF3339 !important;}
.right-ctn .focus {background-color: #148A14 !important;}
.order-condition-ctn /deep/ .setting-line, .setting-line {padding: 0; height: 9vw}
.order-condition-ctn /deep/ .search-block {padding-left: 2vw;}
.logined-bto-selector /deep/ .selector-ctn .order-mode-ctn.ht2 {height: 9vw !important;}
.order-condition-ctn /deep/ .input-qty, .order-condition-ctn /deep/ .input-price-ctn, .order-condition-ctn /deep/ .input-qty-ctn {
    box-sizing: border-box;}

/* 使左側 select 高度對齊右側 input */
.order-condition-ctn /deep/ .single-select-ctn .btn-default-ht-rd {
    height: 9vw;
}
.order-condition-ctn /deep/ .single-select-ctn .select-btn {
    box-sizing: initial;
}
.gtd-warring-ctn {
	min-height: 1em;
	max-height: 5em;
}
</style>