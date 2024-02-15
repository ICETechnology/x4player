<template>
    <div class="announce-popup-wrapper flex-col rd3 mgb10">
        <div class="announce-popup-ctn flex-col pd5 mglr2 posr">
            <div class="announce-subject-ctn flex-center">【{{subject}}】</div>
            <p class="mgb0" v-if="toTrader">{{toTrader}}</p>
            <!-- 公告標題 -->
            <p v-html="contentTitle" class="announce-title-ctn" />
            <!-- 公告內容 -->
            <div v-html="contentData" class="announce-content-ctn clr-gray overflow-y-auto"/>
            <LoadingIcon v-if="isLoading" />
        </div>
         <div class="flex-row flex-center">
            <div class="flex-center flex-1 fd-content-bdc close-only-btn pdtb3" v-if="param" @click="onBtnCloseOnly">{{$ln("我知道了")}}</div>
            <div class="flex-center flex-1 fd-content-bdc cancel-btn" v-if="!param" @click="onBtnCancel">{{$ln("取消")}}</div>
            <div class="flex-center flex-1 fd-content-bdc confirm-btn" v-if="!param" @click="onBtnCheck">{{$ln("查看完整内容")}}</div>
        </div>
    </div>
</template>
<script>
import Announce from "@/components/Announce.vue";
export default {
    data() {
        return {
            // 查詢公告內容結果
            queryContentResult: {},
            isLoading: true,
            // 公告索引
            announceIndex: 0,
            // 最大顯示字數
            maxContent: 80,
        };
    },
    props: ['param'],
    beforeMount() {
        // 一般ac給的公告
        if(!this.param)
            this.checkContent();
        // DCore轉送的登入通知(關閉loading)
        else this.isLoading = false;
    },
    mounted() {
        // 一般ac給的公告(記錄彈出時間)
        if(!this.param)
            this.$store.state.status.announcePopupTime = new Date().toString();
    },
    methods: {
        // 過濾htmltag後的顯示資料(大於最大字數限制時以刪節符號代替)
        stripHtml(html){
            let tmp = document.createElement("DIV");
            // 以正規表示式找出全部&nbsp;
            let re = new RegExp(String.fromCharCode(160), "g");
            tmp.innerHTML = html;
            let showContent = tmp.textContent || tmp.innerText || "";
                showContent = showContent.replaceAll(re, '');
            showContent = showContent.length > this.maxContent? showContent.substr(0, this.maxContent)+"...": showContent;
            return showContent;
        },
        // 依公告id查詢公告內容(如果沒內容時)
        checkContent() {
			if (!this.currentAnnounce.c && this.currentAnnounce._id) {
				this.queryContentResult = M4C.Announce.queryAnnContent(this.currentAnnounce._id);
			}
		},
        // 關閉彈出公告
        onBtnCancel() {
			eventBus.$emit("CLOSE-FLOAT-DIALOG");
            eventBus.$emit("CLOSE-ANNOUNCE-POPUP");
		},
        // 導到公告組件
		onBtnCheck() {
            eventBus.$emit("POPUP-DIALOG", Announce, {announce: this.currentAnnounce}, {$HEAD: {title: this.$ln(`公告列表`)}});
            eventBus.$emit("CLOSE-FLOAT-DIALOG");
		},
        // 只關閉彈出公告(只做關閉公告視窗)
        onBtnCloseOnly() {
            eventBus.$emit("CLOSE-FLOAT-DIALOG");
        },
    },
    watch: {
		/** 查詢狀態改變 */
		'queryContentResult.$STATUS': function(nv) {
			if(nv === 'DONE') {
                this.isLoading = false;
			}
            else {
                this.isLoading = true;
            }
		},
	},
    computed: {
        // 未讀公告列表
        unreadList() {return this.$store.state.data.announcePopupUnreadList;},
        // 當前公告
        currentAnnounce() {return this.unreadList[this.announceIndex]},
        // 公告性質
        subject() {
            try {
                if(this.param) return this.$ln(this.param.TYPE);   // DCore轉送的登入後的通知類型
                return this.$ln(`announceClassify_${this.currentAnnounce.$lvl}`);
            } catch(e) {
                return "";
            }
        },
        // 公告標題
		contentTitle() {
			try {
                // DCore轉送的登入後的通知標題
                if(this.param) {
                    // 標示重要性(目前DCore沒送相關欄位，如果有送要確認是否為level，目前是做爽的。需求之一)
                    let preFixStr = this.param.level == 1? `【${this.$ln('重要')}】-`: '';
                    // 有標題顯示標題文字，沒有就顯示“無標題“(需求之一)
                    let showTitleStr = `${preFixStr}${this.param.HEADER || this.$ln('无标题')}`;
                    return showTitleStr;
                }
				return this.currentAnnounce.s;
			} catch(e) {
				return "";
			}
		},
        // 公告內容
		contentData() {
            try {
                if(this.param) return this.param.DATA;   // DCore轉送的登入後的通知內容(不再處理檟台公告的字數限制，也不做其他處理)
                switch (this.queryContentResult.$STATUS) {
                    case 'QUERY':
                        return this.$ln('查询中');
                    case 'FAIL':
                        return this.$ln('查询失败');
                }
                return this.stripHtml(this.currentAnnounce.c);
            } catch(e) {
                return "";
            }
		},
        // 致: 某資金帳號(for櫃台公告)
        toTrader() {
            if(this.param && this.param.TRADER_ID) {
                return `${this.$ln('致')}: ${this.param.TRADER_ID}`;
            }
        },
    }
}
</script>
<style scoped>
.announce-popup-ctn {
    width: 70vw;
    height: 30vh;
}
.cancel-btn {
	border-bottom-left-radius: 3vw;
}
.confirm-btn {
	border-bottom-right-radius: 3vw;
}
.close-only-btn {
    border-bottom-left-radius: 3vw;
    border-bottom-right-radius: 3vw;
}
.announce-content-ctn {
    max-height: 10em;
}
.desktop .announce-popup-ctn {
    width: 40vh;
    height: 20vw;
}
.mgb0 {margin-bottom: 0;}
</style>