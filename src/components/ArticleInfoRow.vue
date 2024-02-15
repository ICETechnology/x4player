<template>
	<div class="font-size-micro clr-gray2 flex-row flex-start">
		<!-- 作者小圖 -->
		<div class="author-img" :style="`background-image: url('${param && param.rsrcgrp ? param.rsrcgrp.url_avatar : ''}')`"></div>
		<!-- 作者名稱 -->
		<div class="mgl2">{{param.rsrcgrp.name}}</div>
		<!-- 時間前 -->
		<div class="mgl2">{{timeAgoString}}</div>
		<!-- 閱讀數 -->
		<div class="flex-center mgl2"><i class="material-icons md-18 mgr1">remove_red_eye</i><span>{{param.count_view}}</span></div>
		<!-- 喜歡數 -->
		<!-- <div class="flex-center mgl2"><i class="material-icons md-18 mgr1">thumb_up</i><span>{{param.count_like}}</span></div> -->
	</div>
</template>

<script>
export default {
	props: ['param'],
	data() {
		return {}
	},
	beforeMount() {},
    mounted() {},
	beforeDestroy() {},
	components: {},
    methods: {
		timeago(e){let t="";var s=(new Date).getTime();var n=s-e;if(!(n<0)){var g=n/6e4,a=n/36e5,r=n/864e5,i=n/6048e5,o=n/2592e6;if(o>=1&&o<=12)t=" "+parseInt(o)+"月前";else if(i>=1&&i<=3)t=" "+parseInt(i)+"周前";else if(r>=1&&r<=6)t=" "+parseInt(r)+"天前";else if(a>=1&&a<=23)t=" "+parseInt(a)+"小时前";else if(g>=1&&g<=59)t=" "+parseInt(g)+"分钟前";else if(n>=0&&n<=6e4)t="刚刚";else{var l=new Date;l.setTime(e);var u=l.getFullYear(),f=l.getMonth()+1<10?"0"+(l.getMonth()+1):l.getMonth()+1,M=l.getDate()<10?"0"+l.getDate():l.getDate();l.getHours()<10?l.getHours():l.getHours(),l.getMinutes()<10?l.getMinutes():l.getMinutes(),l.getSeconds()<10?l.getSeconds():l.getSeconds();t=u+"-"+f+"-"+M}return t}},
	},
	watch: {},
    computed: {
		timeAgoString() {
			return this.timeago(new Date(this.param.updated_at).getTime());
		},
	},
}
</script>

<style scoped>
.author-img {
	width: 6vw;
	height: 6vw;
	border-radius: 3vw;
	background-size: cover;
}

.desktop .author-img {
	width: 1.2em;
	height: 1.2em;
	border-radius: 0.6em;
}
</style>