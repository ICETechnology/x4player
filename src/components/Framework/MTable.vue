<template>
	<div class="flex-1 m4table-ctn tableFixHead">
		<ScrollBounce class="FULL" :refresh="refresh" @refresh="onRefresh" :slideRate="slideRate">
			<table class="font-size-small">
				<slot></slot>
			</table>
		</ScrollBounce>
	</div>
</template>
<script>
export default {
	props: ["refresh", "slideRate"],
	methods: {
		onRefresh() {
			this.$emit("refresh");
		}
	}
}
</script>

<style>
/* 兩層 slot 導致 scoped 會異常無法套用，因此這邊不使用 scoped */
/* Fixed table head - CSS-only https://stackoverflow.com/questions/21168521/table-fixed-header-and-scrollable-body */
.m4table-ctn.tableFixHead          {
	overflow: hidden;
}
/* -webkit-sticky for ios */
.m4table-ctn.tableFixHead thead th {
	position: sticky;
	top: 0;
	z-index: 1;
	background-color: #253445;
	box-shadow: 0 1px 0px 0px;
}
.m4table-ctn .scroll-bounce-ctn {
	/* has to be scroll, not auto */
	overflow-y: scroll;
	overflow-x: hidden;
}
.m4table-ctn .scroll-bounce-ctn .reflash-circle {
	z-index: 2;
}

.m4table-ctn table {
	border-collapse: collapse;
	width: 100%;
}
.m4table-ctn thead {
	color: #B0B5BC;
}
.m4table-ctn th {
	white-space: nowrap;
	padding: 2vw 0;
}
.m4table-ctn td {
	padding: 2vw 0;
	text-align: center;
}

/** 桌機版 */
.desktop .m4table-ctn th {
	padding: 0.4em 0;
}
.desktop .m4table-ctn td {
	padding: 0.4em 0;
}

</style>