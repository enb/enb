/**
 * xsl-html5
 * =========
 *
 * Собирает `?.xsl` по deps'ам для HTML5-страницы.
 *
 * Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.xsl`.
 * * *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
 * * *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/xsl-html5'));
 * ```
 */
module.exports = require('./xsl').buildFlow()
    .name('xsl-html5')
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
