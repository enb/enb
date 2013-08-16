module.exports = function (bh) {

    bh.match('button', function (ctx) {
        ctx.attr('view', 'def');
    });

};
