# 🗑️ 削除判断AIアシスタント・プロンプト

## ChatGPT/Claude用プロンプト

```
あなたは「削除の達人」です。
コードの断捨離を支援してください。

以下のコードを分析し、削除可能な部分を特定してください：
[コードをペースト]

判断基準：
1. 使われていない関数/変数
2. 冗長な抽象化
3. 将来のための準備コード
4. コメントアウトされたコード
5. 8行を超える関数

出力形式：
- 削除推奨度: S/A/B/C
- 削除可能な行数: X行
- 削除後の行数: Y行
- 具体的な削除箇所（行番号付き）
```

## 使用例

### 入力
```javascript
// ユーザー管理クラス（将来の拡張に備えて）
class UserManager {
  constructor() {
    this.users = [];
    this.cache = new Map(); // 未使用
  }
  
  // ユーザー追加（バリデーション付き）
  addUser(user) {
    // TODO: メール検証
    // if (!this.validateEmail(user.email)) {
    //   throw new Error('Invalid email');
    // }
    this.users.push(user);
  }
  
  // 未実装
  validateEmail(email) {
    // 将来実装予定
  }
  
  getUsers() {
    return this.users;
  }
}
```

### AIの回答例
```
削除推奨度: S級（即削除）
削除可能な行数: 12行
削除後の行数: 3行

削除箇所：
- 4行目: this.cache（未使用）
- 8-13行目: コメントアウトされたコード
- 16-19行目: 未実装のvalidateEmail

リファクタリング後：
const users = [];
const addUser = (user) => users.push(user);
const getUsers = () => users;
```

## クイックプロンプト集

### 8行チャレンジ
```
このコードを8行以内に収めてください。
機能は維持し、可読性を保ってください。
```

### YAGNI診断
```
YAGNIの原則に基づき、「今」必要ない部分を特定してください。
```

### 複雑度診断
```
このコードの認知的複雑度を評価し、
シンプル化の提案をしてください。
```

## カスタムルール追加

```
追加ルール：
- テストのないコードは削除候補
- 3ヶ月触られていないコードは削除
- "Manager"や"Helper"という名前は要注意
```

## 定期実行スクリプト

```bash
#!/bin/bash
# 週次削除レビュー
echo "今週の削除候補を探しています..."
find . -name "*.js" -mtime +90 -exec echo "3ヶ月以上更新なし: {}" \;
grep -r "TODO\|FIXME\|HACK" . | wc -l
echo "個のTODOが見つかりました。削除を検討してください。"
```

## 成功指標

- 週10%のコード削減
- S級評価の関数が80%以上
- 平均関数長5行以下

**Remember**: 最高のコードは書かれなかったコード！