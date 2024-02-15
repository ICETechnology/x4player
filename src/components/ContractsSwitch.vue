<template>
    <div>
        <!-- 當 isPageHead == true 的時候 -->
        <div v-if="isPageHead" class="flex-row">
            <div class="flex-center">
                <i class= "material-icons tcef mgr3 icon-arrow" @click="onPreSid" :class="{disabled:!preContract}" v-if="preContract">arrow_left</i>
            </div>
            <div class="flex-center flex-col" @click="onBtnSearch">
                <div class="nowrap">{{$store.state.selectedSymbol.Name}}</div>
                <div class="font-size-micro nowrap">{{$store.state.selectedSymbol.CIDM4}}</div>
            </div>
            <div class="flex-center">
                <i class= "material-icons tcef mgl3 icon-arrow" @click="onNextSid" :class="{disabled:!nextContract}" v-if="nextContract">arrow_right</i>
            </div>
        </div>
        <!-- 當 isPageHead == false 的時候 -->
        <div v-if="!isPageHead" class="contracts-switch-ctn flex-row" :class="{disabled: !sidList || !sidList.length}">
            <div class="pre-contract flex-center flex-start tcef" @click="onPreSid" :class="{disabled:!preContract}" v-if="preContract">
                <i class= "material-icons">arrow_left</i>
                {{convertSymbolName(preContract)}}
            </div>
            <div class="flex-1" v-if="sidList && sidList.length"/>
            <div class="flex-1 flex-center" v-if="!sidList || !sidList.length">{{$ln('无资料')}}</div>
            <div class="next-contract flex-center flex-end tcef" @click="onNextSid" :class="{disabled:!nextContract}" v-if="nextContract">
                {{convertSymbolName(nextContract)}}
                <i class= "material-icons">arrow_right</i>
            </div>
        </div>
    </div>
</template>
<script>
export default {
    data() {
        return {
            sidList: [],
            hotIndex: [],
        }
    },
    props: ["preSidList", "value",'isPageHead'],
	mounted() {
        // 將熱門的 index 先存進 hotIndex，若左右切換可判斷是否為熱門
        this.preSidList.forEach(sid => {
            if(M4C.Symbol.isHotSID(sid)) {
                let tmp = this.preSidList.indexOf(sid);
                this.hotIndex.push(tmp);
            }
        });
        // 產生去除 HOT 字串的 sidList
        this.sidList = this.preSidList.map(item => {
            return M4C.Symbol.toMonthSymbol(item);
        });
    },
    methods: {
        // 切換上一檔商品
        onPreSid() {
            if(this.value)
                this.$emit('input', this.preContract);
            else this.$store.commit("setSelectedSymbol", this.preContract);
            // 判斷是否熱門
            this.cidm4ShowHot();
        },
        // 切換下一檔商品
        onNextSid() {
            if(this.value)
                this.$emit('input', this.nextContract);
            else this.$store.commit("setSelectedSymbol", this.nextContract);
            // 判斷是否熱門
            this.cidm4ShowHot();
        },
        // 商品名稱轉換
        convertSymbolName(sid) {
            if(sid) return `${this.getName(sid)} ${this.getSymbolMonth(sid)}${this.setPRIADJ(sid)}`;
        },
        // "澳幣"
		getName(sid) {
			return M4C.Symbol.getContractName(sid);
		},
        // "6A1906"
        getSymbolMonth(sid) {
            let sids = sid.split('.');
            // 針對期權商品調整(只顯示月及履約價)
            if(sids[1] == "O"){
                let strikePrice = M4C.Option.getStrike(sid);
                let mth = sids[4];
			    mth = mth ? Number(mth.substr(2).split('').slice(-2).join('')) : '';
                return `${mth} ${this.$ln('月')} ${strikePrice}`;
            }
            // 其他以代碼年月顯示。
			return M4C.Symbol.getCIDM4(sid);
		},
        // 除權息標示
        setPRIADJ(sid) {
			let minfo = M4C.Symbol.getMainformInfo(sid);
			return minfo ? (minfo.SetPRIADJ || '') : '';
		},
		/** 搜尋 */
		onBtnSearch() {
			// 防連點機制
			if (this.clickLock) return; this.clickLock = setTimeout(()=>{delete this.clickLock;}, 1000);
			eventBus.$emit("POPUP-DIALOG", 'SearchPlus', {from: 'ContractsSwitch'}, {transName: 'float'});
		},
        // 判斷是否熱門
        cidm4ShowHot() {
            this.hotIndex.forEach( idx => {
                if(this.sidList[idx] == this.$store.state.selectedSymbol.ID)
                    this.$store.commit("setSelectedSymbolDisplayAsHot");
            });
        },
    },
    computed: {
        // 前一檔商品
        preContract() {
            // 防錯處理
            if(!this.currentContractIdx === undefined) return;
            // 依當前商品位置找上一檔商品位置
            let idx = this.currentContractIdx - 1;
            // 做無縫跳到列表最後一個
            if(idx == -1) idx = this.sidList.length-1;
            return this.sidList[idx];
        },
        // 下一檔商品
        nextContract() {
            // 防錯處理
            if(this.currentContractIdx === undefined) return;
            // 依當前商品位置找下一檔商品位置
            let idx = this.currentContractIdx + 1;
            // 做無縫跳到列表第一個
            if(idx == this.sidList.length) idx = 0;
            return this.sidList[idx];
        },
        // 當前商品位置
        currentContractIdx() {
            // 防呆處理
            if(!this.sidList || !this.sidList.length) return;
            // 如有v-model使用方式以v-model方式尋找商品位置。
            let sid = this.value? this.value: this.$store.state.selectedSymbol.ID;
            let idx = this.sidList.indexOf(sid);
            if(idx != -1) {
                return idx;
            }
            // 找不到位置且有清單資料，取中間商品位置使用。
            else return Math.round(this.sidList.length / 2);
        },
    },
}
</script>
<style scoped>
.pre-contract,.next-contract {
    min-width: 5em;
}
.icon-arrow {
    color: white !important;
    font-size: 34px;
}
.icon-arrow.touching {
    border-radius: 16px;
    background-color: #FF9800 !important;
}

</style>