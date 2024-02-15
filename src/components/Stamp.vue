<template>
	<div class="FULL flex-center no-data-ctn" :class="stampStyle">
		<div class="content-ctn font-size-large flex-center" :class="{'clr-gray': !stampStyle}" @click="onClick">
			<i class="material-icons md-36">{{displayIcon}}</i>
			<span class="mgl2">{{$ln(displayText)}}</span>
			<div v-if="isLoading" class="nodata-loading-icon posr mgl2">
				<LoadingIcon class="loading-icon" />
			</div>
		</div>
	</div>
</template>

<script>
export default {
	props: ["stampStatus", "ignoreLogin", "stampStyle"],
	data() {
		return {

		}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		onClick() {
			// 發出被點擊的事件
			this.$emit("onStampClick");
		},
	},
	watch: {},
    computed: {
		displayIcon() {
			switch (this.stampStatus) {
				case "FAIL":
					return "error";
				case "QUERY":
					return "cloud_download";
				case "SELF_SELECT_EMPTY":
					return "playlist_add";
				default:
					return "folder_open";
			};
		},
		displayText() {
			// 是否要求忽略登入狀態
			if (!this.ignoreLogin) {
				// 未登入狀態
				if (!this.$store.state.login.btaID || !this.$store.state.selectedWSConn.loginReady)
					return `未登录`;
			}
			switch (this.stampStatus) {
				case "FAIL":
					return `查询失败`;
				case "QUERY":
					return `查询中`;
				case "SELF_SELECT_EMPTY":
					return `请到商品图表里添加自选商品`;
				case "NO_ANNOUNCE":
					return `尚无公告`;
				case "NO_MONTH_ANNOUNCE":
					return `本月份无公告`;
				case "NO_WATCHLIST":
					return `请加入关注商品`;
				default:
					return `无资料`;
			};
		},
		isLoading() {
			return this.stampStatus === "QUERY";
		}
	},
}
</script>

<style lang="scss" scoped>
.content-ctn {
	padding: 2vw 4vw;
	border: 1px solid #999;
	border-radius: 2vw;
}
.nodata-loading-icon {
	width: 36px;
}
.black-ui {
	
}
// 黑色樣式
.black-ui{
	@extend .clr-black;
	> .content-ctn {
		border-color:black;
	}
	
}

/* 桌機版 */
.desktop .content-ctn {
	padding: 8px 16px;
	border-radius: 8px;
}
</style>