module.exports = function (bh) {
    bh.match('page', function (ctx) {
        ctx.tag('page');
    });
};
