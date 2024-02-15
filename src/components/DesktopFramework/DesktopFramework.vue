<template>
    <div class="desktop-framework-ctn">
		<DesktopCore />
		<!-- 正常版面 -->
		<div class="FULL" v-if="!maxTabComs">
			<DesktopHead class="head" />
			<transition name="slide-left">
				<DesktopBody ref="body" class="body" :layout="selectedLayout.layoutBody" :key="selectedLayout.layoutKey" />
			</transition>
		</div>
		<!-- 最大化元件 -->
		<div class="FULL desktop-max-component" v-if="maxTabComs">
			<DesktopTabGroup :coms="maxTabComs" :max="true" />
		</div>
		<!-- 彈窗控制核心 -->
		<DesktopDialogControl />
		<transition-group name="show">
			<DesktopDialog v-for="(obj, idx) in dskDlgList" :dskDlgObj="obj" :key="`Dialog-${obj.UCID}`" :class="`Dialog-${obj.UCID}`" />
		</transition-group>
		<!-- 中央彈出式視窗 -->
		<PopupFloatDialog />
		<!-- 右鍵選單 -->
		<DesktopContextMenu />
		<!-- 元件列表視窗 -->
		<DesktopComponents />
		<!-- 同意書容器(含遮罩) -->
		<DesktopAgreeContainer v-if="displayAgree" @close="displayAgree = false"/>
		<!-- 截圖中 -->
		<ScreenShotMask />
		<!-- 更多 -->
		<transition name="show">
			<ExtraMenu v-if="$store.state.status.displayExtraMenu" />
		</transition>
    </div>
</template>

<script>
import Vue from 'vue';
export default {
	props: [],
	data() {
		return {
			storageKey: `${this.$store.state.config.projectID}_Desktop_Layout`,
			displayAgree: false,
		}
	},
	beforeMount() {
		// 準備與建立版面
		this.prepareLayout();
		// 元件類別對應名稱表
		this.$store.state.config.CONFIG.COMPONENTS.forEach(obj => {
			obj.list.forEach(o=>this.$store.state.desktop.comMap[o.key || o.comClass] = o);
		});
		// 期權雲
		Vue.use(OptionCloud, this.$store.state.wsConnMap.quote.acPdSetting.optioncloud.plugin);
	},
    mounted() {
		// 移除載入主程式畫面
		window.removeScreenLoadingBuild();
		// 取得 OptionCloud 的版本號
		this.$store.state.device.optionCloudVersion = OptionCloud.version;
		// 尚未確認同意書
		if (!localStorage.getItem(`${this.$store.state.config.projectID}_AGREE`)) {
			this.displayAgree = true;
		}
	},
	beforeDestroy() {},
	components: {},
    methods: {
		/** 準備與建立版面 */
		prepareLayout() {
			let storageLayout = localStorage.getItem(this.storageKey);
			// 存在已儲存的版面時 -> 使用已儲存的版面
			if (storageLayout) {
				this.$store.state.desktop.layout = JSON.parse(storageLayout);
			}
			// 不存在已儲存的版面時 -> 載入預設版面
			else {
				try {
					let strLayout = Base64.decode(this.$store.state.config.CONFIG.DEFAULT_LAUOUT);
					let layout = JSON.parse(strLayout);
					if (Array.isArray(layout))
						this.$store.state.desktop.layout = layout;
				}
				catch(e) {
					this.$store.state.notify(`error`, `汇入版面格式错误`);
				}
			}
			// 仍無任何版面時 -> 塞一個空白版面
			if (this.$store.state.desktop.layout.length === 0)
				this.$store.state.desktop.layout = [{layoutKey: "".random(), layoutName: "新版面"}];
		},
		// 儲存前 loop 所有 key 檢查與處理
		// removeTooLarge(obj) {
		// 	for (let key in obj) {
		// 		let type = typeof(obj[key]);
		// 		if (type === "object")
		// 			this.removeTooLarge(obj[key]);
		// 		else if (type === 'string' && obj[key].length > 1024)
		// 			delete obj[key];
		// 	}
		// },
	},
	watch: {
		/** 監聽並即時儲存整個 layout 物件 */
		layout: {
			deep: true,
			handler(nv) {
				console.log(`DesktopFramework.layout-change : `, nv);
				// 以下這段是可以在儲存前 loop 所有 key 做檢查與處理的範例
				// console.time(`LAYOUT-CHANGE`);
				// let orgLeyoutStr = JSON.stringify(nv);
				// let newLayoutObj = JSON.parse(orgLeyoutStr);
				// this.removeTooLarge(newLayoutObj);
				// let newLeyoutStr = JSON.stringify(newLayoutObj);
				// console.log(`LAYOUT-CHANGE orgLeyoutStr: `, orgLeyoutStr.length, `, newLayoutObj: `, newLeyoutStr.length);
				// localStorage.setItem(this.storageKey, newLeyoutStr);
				// console.timeEnd(`LAYOUT-CHANGE`);
				let strLeyout = JSON.stringify(nv);
				localStorage.setItem(this.storageKey, strLeyout);
			}
		}
	},
    computed: {
		layout() {
			return this.$store.state.desktop.layout;
		},
		maxTabComs() {
			return this.$store.state.desktop.maxTabComs;
		},
		selectedLayout(){
			let selectedLayout = this.layout.find(obj=>obj.selected);
			selectedLayout = this.$store.state.desktop.selectedLayout = selectedLayout || this.layout[0];
			this.$set(selectedLayout, 'selected', true);
			if (!selectedLayout.layoutBody)
				this.$set(selectedLayout, 'layoutBody', {});
			return selectedLayout;
		},
		dskDlgList() {
			// return this.selectedLayout.dskDlgList;
			return this.$store.state.desktop.dskDlgList;
		},
	},
}
</script>

<style scoped>
.desktop-framework-ctn {
	background-color: #0d1320;
}
.head {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 70px;
	border-bottom: 3px solid rgb(196, 167, 3);
}
.body {
	position: absolute;
	top: 73px;
	left: 0;
	right: 0;
	bottom: 0;
}
</style>