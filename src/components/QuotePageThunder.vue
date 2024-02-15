<template>
	<div class="FULL flex-col">
		<!-- 閃電下單 -->
		<Thunder :suspend="suspend" />
	</div>
</template>

<script>
import Thunder from "@/components/Thunder/Thunder.vue";
import SymbolPositionRow from "@/components/SymbolPositionRow.vue";
export default {
	props: ['suspend'],
	components: {
		Thunder,
		SymbolPositionRow,
	}
}
</script>
