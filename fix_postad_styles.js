const fs = require('fs');
const path = './src/screens/PostAdScreen.js';
let content = fs.readFileSync(path, 'utf-8');

const target = "  uploadBox: { height: 90, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(247,243,232,.3)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },";

const addition = target + "\n" +
"  scopeRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 8 },\n" +
"  scopeBtn: { flex: 1, backgroundColor: colors.tarpDark, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(247,243,232,.2)' },\n" +
"  scopeBtnActive: { backgroundColor: colors.mustard, borderColor: colors.mustard },\n" +
"  scopeText: { color: colors.paper, fontSize: 12.5, fontWeight: '700' },\n" +
"  scopeTextActive: { color: colors.ink },";

if (content.includes(target)) {
  content = content.replace(target, addition);
  fs.writeFileSync(path, content, 'utf-8');
  console.log('DONE');
} else {
  console.log('NOT FOUND');
}
