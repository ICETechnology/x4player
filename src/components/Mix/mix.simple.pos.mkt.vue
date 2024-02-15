<template>
    <div class="mix-simpl-pos-mkt-ctn flex-col">
        <SymbolPositionRow mode="orderBlockSimplePos" class="pdr3"/>
		<div class="divider-bottom" />
        <SymbolMiniQ :showBS1P="true" />
    </div>
</template>
<script>
export default {
    data() {
        return {}
    },
}
</script>