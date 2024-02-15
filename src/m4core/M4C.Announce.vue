<template>
    <div class="m4c-announce hidden" />
</template>

<script>
import Announce from "@/components/Announce.vue";
import AnnouncePopup from "@/components/AnnouncePopup.vue";
import M4C_Base from '@/m4core/M4C.Base';
export default {
	mixins: [M4C_Base],
	props: [],
	data() {
		return {
			mapIdToContent: {},
		}
	},
	beforeMount() {
		// 支持 Vuex + Window全域
		M4C.Announce = this.$store.state.m4c.announce = this;
		// 註冊資料分派
		M4C.regDispatch({'s': 'ann', 'c': 'ann.unreads', 'callback': this.onAnnUnreads.bind(this)});
		M4C.regDispatch({'s': 'ann', 'c': 'ann.find', 'callback': this.onAnnListData.bind(this)});
		M4C.regDispatch({'s': 'ann', 'c': 'ann.get', 'callback': this.onAnnContentData.bind(this)});
		M4C.regDispatch({'s': 'ann', 'c': 'ann.new', 'callback': this.onAnnNewData.bind(this)});
	},
	mounted() {
		// 公告要走交易連線 (預設是在報價連線)
		if (this.announceSetting && this.announceSetting.fromTradeConnection)
			this.$store.state.config.sendByQuote.ann = false;
	},
    methods: {
		/** 查詢公告未讀數 */
		queryAnnUnreads() {
			let result = this.baseQuery('ann.unreads');
			let cmd = {
				's': 'ann',
				'c': 'ann.unreads',
				'd': {},
				'r': ''.random(),
			};
			M4C.send(cmd);
			return result;
		},
		/** 查詢公告列表 */
		queryAnnList() {
			// 完整公告清單
			this.$store.state.data.announceList = [];
			// 公告性質分類清單
			this.$store.state.data.announceClassify = {};
			// 彈出公告未讀清單
			this.$store.state.data.announcePopupUnreadList = [];
			let result = this.baseQuery('ann.find');
			let cmd = {
				's': 'ann',
				'c': 'ann.find',
				'd': {
					'pager': {
						'pg': 1,
						'sz': 1000,
					}
				},
				'r': ''.random(),
			};
			M4C.send(cmd);
			return result;
		},
		/** 查詢指定公告內容 */
		queryAnnContent(_id) {
			let cmd = {};
			cmd.s = 'ann';
			cmd.c = 'ann.get';
			cmd.r = ''.random();
			cmd.d = {};
			cmd.d._id = _id;
			M4C.send(cmd);
			return this.baseQuery(`ann.get:${cmd.r}`);
		},
		/** 已讀取指定公告 */
		readAnn(_id) {
			let cmd = {};
			cmd.s = 'ann';
			cmd.c = 'ann.read';
			cmd.r = ''.random();
			cmd.d = {_id: _id};
			M4C.send(cmd);
			this.mapIdToContent[_id].isRead = true;
		},
		// 加入新公告
		appendAnnounce(obj) {
			this.$store.state.data.announceList.unshift(obj);
			this.mapIdToContent[obj._id] = obj;
			this.classifyAnnounce(obj);
		},
		// 依公告性質分類(以計算後的加值欄位$lvl區分)
		classifyAnnounce(obj) {
			// 無此性質分類時加入性質分類的響應式陣列。
			if(!this.$store.state.data.announceClassify[obj.$lvl]) {
				this.$set(this.$store.state.data.announceClassify, obj.$lvl, []);
			}
			this.$store.state.data.announceClassify[obj.$lvl].unshift(obj);
		},
		// 公告未讀數
		onAnnUnreads(data) {
			let result = this.baseOnData('ann.unreads', data);
			if (data.d && data.d.unreads) {
				this.$store.state.data.announceUnreads = data.d.unreads;
				// 有未讀公告時查詢清單
				if(this.$store.state.data.announceUnreads){
					M4C.Announce.queryAnnList();
				}
			}
		},
		// 公告列表
		onAnnListData(data) {
			let result = this.baseOnData('ann.find', data);
			data.d.data.forEach((obj)=>{
				// 由於appbo的性質分類是乘100，所以要除回100(以符合PM定義的0-5)。
				let $lvl = Math.floor(obj.lvl / 100);
				// 將計算後的資料當加值欄位
				obj['$lvl'] = $lvl;
				this.appendAnnounce(obj);
				// 整理未讀彈出公告列表
				if(!obj.isRead && obj.popup_notice) {
					this.$store.state.data.announcePopupUnreadList.unshift(obj);
				}
			});
			// 以更新時間排序未讀彈出公告列表
			if(this.$store.state.data.announcePopupUnreadList.length) {
				this.$store.state.data.announcePopupUnreadList.sort((a,b)=> {return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()});
			}
		},
		// 公告內容
		onAnnContentData(data) {
			let result = this.baseOnData(`ann.get:${data.r}`, data);
			let newAnnObj = data.d;
			let orgAnnObj = this.mapIdToContent[newAnnObj._id];
			for (let key in newAnnObj) {
				this.$set(orgAnnObj, key, newAnnObj[key]);
			}
		},
		// 即時公告
		onAnnNewData(data) {
			let obj = data.d;
			// 由於appbo的性質分類是乘100，所以要除回100(以符合PM定義的0-5)。
			let $lvl = Math.floor(obj.lvl / 100);
			// 將計算後的資料當加值欄位
			obj['$lvl'] = $lvl;
			// 新增公告
			this.appendAnnounce(obj);
			// 公告未讀數+1
			this.$store.state.data.announceUnreads++;
			// 整理未讀彈出公告列表(未讀及彈出公告)
			if(!obj.isRead && obj.popup_notice) {
				this.$store.state.notify({
					head: this.$ln(`announceClassify_${$lvl}`),
					body: obj.s,
					icon: `campaign`,
					delay: 86400000,
					onclick: ()=>{
						eventBus.$emit("POPUP-DIALOG", Announce, {announce: obj}, {$HEAD: {title: this.$ln(`公告列表`)}});
					},
				});
				this.$store.state.status.announcePopupTime = new Date().toString();
			}
		},
	},
	watch: {
		isPopupUnread(nv) {
			// 彈出未讀公告(有未讀公告及沒有設定不彈出公告)
			if(nv && !this.preventPopupAnnounce) {
				eventBus.$emit("POPUP-FLOAT-DIALOG",  {comClass: AnnouncePopup});
			}
		},
	},
    computed: {
		// 是否有未讀的彈出公告
		isPopupUnread() {
			try {
				// 前次公告彈出時間
				let popupTimeST = new Date(this.$store.state.status.announcePopupTime).getTime();
				// 最新彈出公告時間
				let latestAnnounceUpdateTime = this.$store.state.data.announcePopupUnreadList[0]? this.$store.state.data.announcePopupUnreadList[0].updated_at: "";
				// 最新彈出公告時間(轉timestamp)
				let announceTimeST = new Date(latestAnnounceUpdateTime).getTime();
				// 最新彈出公告時間 > 前次公告彈出時間 => 有新公告需跳出
				let newAnnounce = popupTimeST && announceTimeST? announceTimeST - popupTimeST > 0 : false;
				// 有彈出公告清單 且 無前次公告彈出時間 或 有新的彈出公告
				return this.$store.state.data.announcePopupUnreadList.length && (!popupTimeST || newAnnounce);
			} catch(e) {
				return false;
			}
		},
		// 不彈出公告(by測試用，避免非預期彈出對話框影響自動測試)
		preventPopupAnnounce() {return window.$preventPopupAnnounce;},
		// 公告設定
		announceSetting() {
			try{return this.$store.state.config.publicPdSetting.function.announce;}catch(e){}
		}
	},
}
</script>
