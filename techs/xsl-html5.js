/**
 * xsl-html5
 * =========
 *
 * Технология переехала в пакет `enb-lego-xml`.
 */
module.exports = require('./xsl').buildFlow()
    .name('xsl-html5')
    .deprecated('enb', 'enb-lego-xml')
    .methods({
        getAppendXsl: function () {
            var res = [this._appendXsl];
            res.push(
                '<xsl:output encoding="UTF-8" method="html" indent="no" ' +
                'media-type="text/html" omit-xml-declaration="yes" />'
            );
            res.push('<xsl:template match="lego:b-page" xmlns:lego="https://lego.yandex-team.ru">');
            res.push('    <xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html></xsl:text>');
            res.push('    <xsl:apply-imports/>');
            res.push('</xsl:template>');
            res.push('</xsl:stylesheet>');
            return res.join('\n');
        }
    })
    .createTech();
