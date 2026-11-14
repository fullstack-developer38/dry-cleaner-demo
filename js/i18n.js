/* language module */
(function () {
  const D = window.D;
  D.LANGS = [['en', 'EN', 'en-US'], ['fr', 'FR', 'fr-FR'], ['ko', 'KO', 'ko-KR'], ['ja', 'JA', 'ja-JP']];
  const S = {
    'sign_out': ['Sign out', 'Se d\u00e9connecter', '\ub85c\uadf8\uc544\uc6c3', '\u30ed\u30b0\u30a2\u30a6\u30c8'],
    'hi': ['Hi {n}', 'Bonjour {n}', '{n}\ub2d8, \uc548\ub155\ud558\uc138\uc694', '\u3053\u3093\u306b\u3061\u306f\u3001{n}\u3055\u3093'],
    'ready_cap': ['{q} items \u00b7 pressed and bagged', '{q} articles \u00b7 repass\u00e9s et emball\u00e9s', '{q}\ubc8c \u00b7 \ub2e4\ub9bc\uc9c8 \ubc0f \ud3ec\uc7a5 \uc644\ub8cc', '{q}\u70b9 \u00b7 \u30d7\u30ec\u30b9\u30fb\u5305\u88c5\u6e08\u307f'],
    'ready_pickup': ['Ready for pickup', 'Pr\u00eat \u00e0 retirer', '\uc218\ub839 \uc900\ube44 \uc644\ub8cc', '\u53d7\u3051\u53d6\u308a\u6e96\u5099\u5b8c\u4e86'],
    'due': ['{a} due', '{a} \u00e0 payer', '\uc794\uc561 {a}', '\u6b8b\u9ad8 {a}'],
    'pay_now': ['Pay now', 'Payer', '\uc9c0\uae08 \uacb0\uc81c', '\u4eca\u3059\u3050\u652f\u6255\u3046'],
    'paid': ['Paid', 'Pay\u00e9', '\uacb0\uc81c \uc644\ub8cc', '\u652f\u6255\u3044\u6e08\u307f'],
    'details': ['Details', 'D\u00e9tails', '\uc0c1\uc138 \ubcf4\uae30', '\u8a73\u7d30'],
    'nothing_ready': ['Nothing is ready yet. We will notify you.', 'Rien n\'est encore pr\u00eat. Nous vous pr\u00e9viendrons.', '\uc544\uc9c1 \uc900\ube44\ub41c \uc8fc\ubb38\uc774 \uc5c6\uc2b5\ub2c8\ub2e4. \uc900\ube44\ub418\uba74 \uc54c\ub824 \ub4dc\ub9b4\uac8c\uc694.', '\u307e\u3060\u6e96\u5099\u3067\u304d\u305f\u6ce8\u6587\u306f\u3042\u308a\u307e\u305b\u3093\u3002\u6e96\u5099\u304c\u3067\u304d\u305f\u3089\u304a\u77e5\u3089\u305b\u3057\u307e\u3059\u3002'],
    'rewards': ['Rewards', 'Fid\u00e9lit\u00e9', '\ub9ac\uc6cc\ub4dc', '\u30dd\u30a4\u30f3\u30c8'],
    'pts': ['{n} pts', '{n} pts', '{n}\ud3ec\uc778\ud2b8', '{n} \u30dd\u30a4\u30f3\u30c8'],
    'credit': ['Store credit', 'Avoir', '\uc801\ub9bd\uae08', '\u30b9\u30c8\u30a2\u30af\u30ec\u30b8\u30c3\u30c8'],
    'in_shop': ['In the shop', 'En atelier', '\ub9e4\uc7a5\uc5d0\uc11c \uc791\uc5c5 \uc911', '\u5e97\u8217\u3067\u51e6\u7406\u4e2d'],
    'items_dropped': ['{q} items \u00b7 dropped {d}', '{q} articles \u00b7 d\u00e9pos\u00e9 le {d}', '{q}\ubc8c \u00b7 {d} \uc811\uc218', '{q}\u70b9 \u00b7 \u9810\u3051\u65e5 {d}'],
    'nav_home': ['Home', 'Accueil', '\ud648', '\u30db\u30fc\u30e0'],
    'nav_orders': ['Orders', 'Commandes', '\uc8fc\ubb38', '\u6ce8\u6587'],
    'nav_rewards': ['Rewards', 'Fid\u00e9lit\u00e9', '\ub9ac\uc6cc\ub4dc', '\u30dd\u30a4\u30f3\u30c8'],
    'nav_alerts': ['Alerts', 'Alertes', '\uc54c\ub9bc', '\u304a\u77e5\u3089\u305b'],
    'orders': ['Orders', 'Commandes', '\uc8fc\ubb38', '\u6ce8\u6587'],
    'back': ['Back', 'Retour', '\ub4a4\ub85c', '\u623b\u308b'],
    'ticket_no': ['No. {id}', 'N\u00b0 {id}', 'No. {id}', 'No. {id}'],
    'total': ['Total', 'Total', '\ud569\uacc4', '\u5408\u8a08'],
    'bal_due': ['Balance due', 'Reste \u00e0 payer', '\uc794\uc561', '\u6b8b\u9ad8'],
    'pay_amt': ['Pay {a}', 'Payer {a}', '{a} \uacb0\uc81c', '{a} \u3092\u652f\u6255\u3046'],
    'req_dlv': ['Request delivery', 'Demander une livraison', '\ubc30\ub2ec \uc694\uccad', '\u914d\u9054\u3092\u4f9d\u983c'],
    'not_closed': ['Paying online does not close the ticket. It closes at pickup or when delivery is completed.', 'Le paiement en ligne ne cl\u00f4t pas le ticket. Il est cl\u00f4tur\u00e9 au retrait ou \u00e0 la livraison.', '\uc628\ub77c\uc778 \uacb0\uc81c\ub9cc\uc73c\ub85c \uc8fc\ubb38\uc774 \uc885\ub8cc\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. \uc218\ub839\ud558\uac70\ub098 \ubc30\ub2ec\uc774 \uc644\ub8cc\ub418\uba74 \uc885\ub8cc\ub429\ub2c8\ub2e4.', '\u30aa\u30f3\u30e9\u30a4\u30f3\u3067\u652f\u6255\u3063\u3066\u3082\u6ce8\u6587\u306f\u5b8c\u4e86\u3057\u307e\u305b\u3093\u3002\u53d7\u3051\u53d6\u308a\u307e\u305f\u306f\u914d\u9054\u306e\u5b8c\u4e86\u6642\u306b\u5b8c\u4e86\u3057\u307e\u3059\u3002'],
    'verified': ['Verified with store system {ago} \u00b7 version {v}', 'V\u00e9rifi\u00e9 avec le magasin {ago} \u00b7 version {v}', '\ub9e4\uc7a5 \uc2dc\uc2a4\ud15c\uc5d0\uc11c \ud655\uc778 {ago} \u00b7 \ubc84\uc804 {v}', '\u5e97\u8217\u30b7\u30b9\u30c6\u30e0\u3067\u78ba\u8a8d\u6e08\u307f {ago} \u00b7 \u30d0\u30fc\u30b8\u30e7\u30f3 {v}'],
    'last_verified': ['Last verified {ago} \u00b7 version {v}', 'Derni\u00e8re v\u00e9rification {ago} \u00b7 version {v}', '\ub9c8\uc9c0\ub9c9 \ud655\uc778 {ago} \u00b7 \ubc84\uc804 {v}', '\u6700\u7d42\u78ba\u8a8d {ago} \u00b7 \u30d0\u30fc\u30b8\u30e7\u30f3 {v}'],
    'ago_now': ['just now', '\u00e0 l\'instant', '\ubc29\uae08', '\u305f\u3063\u305f\u4eca'],
    'ago_s': ['{n}s ago', 'il y a {n} s', '{n}\ucd08 \uc804', '{n}\u79d2\u524d'],
    'ago_m': ['{n} min ago', 'il y a {n} min', '{n}\ubd84 \uc804', '{n}\u5206\u524d'],
    'st_Dropped off': ['Dropped off', 'D\u00e9pos\u00e9', '\uc811\uc218\ub428', '\u53d7\u4ed8\u6e08\u307f'],
    'st_In process': ['In process', 'En cours', '\uc138\ud0c1 \uc911', '\u51e6\u7406\u4e2d'],
    'st_Ready': ['Ready', 'Pr\u00eat', '\uc900\ube44 \uc644\ub8cc', '\u6e96\u5099\u5b8c\u4e86'],
    'st_Picked up': ['Picked up', 'Retir\u00e9', '\uc218\ub839 \uc644\ub8cc', '\u53d7\u3051\u53d6\u308a\u6e08\u307f'],
    'st_Delivered': ['Delivered', 'Livr\u00e9', '\ubc30\ub2ec \uc644\ub8cc', '\u914d\u9054\u6e08\u307f'],
    'st_Cancelled': ['Cancelled', 'Annul\u00e9', '\ucde8\uc18c\ub428', '\u30ad\u30e3\u30f3\u30bb\u30eb\u6e08\u307f'],
    'banner_hold': ['Online payments are paused by the platform operator. You can still pay at the counter.', 'Les paiements en ligne sont suspendus par l\'op\u00e9rateur. Vous pouvez toujours payer au comptoir.', '\ud50c\ub7ab\ud3fc \uc6b4\uc601\uc790\uac00 \uc628\ub77c\uc778 \uacb0\uc81c\ub97c \uc77c\uc2dc \uc911\uc9c0\ud588\uc2b5\ub2c8\ub2e4. \ub9e4\uc7a5 \uce74\uc6b4\ud130\uc5d0\uc11c\ub294 \uacb0\uc81c\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.', '\u30aa\u30f3\u30e9\u30a4\u30f3\u6c7a\u6e08\u306f\u904b\u55b6\u8005\u306b\u3088\u308a\u4e00\u6642\u505c\u6b62\u4e2d\u3067\u3059\u3002\u5e97\u982d\u3067\u306f\u304a\u652f\u6255\u3044\u3044\u305f\u3060\u3051\u307e\u3059\u3002'],
    'banner_off': ['<b>Store system unreachable.</b> Showing what we last verified at {t}. Online payment is paused until it reconnects.', '<b>Syst\u00e8me du magasin injoignable.</b> Donn\u00e9es v\u00e9rifi\u00e9es \u00e0 {t}. Le paiement en ligne reprendra apr\u00e8s la reconnexion.', '<b>\ub9e4\uc7a5 \uc2dc\uc2a4\ud15c\uc5d0 \uc5f0\uacb0\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.</b> {t}\uc5d0 \ub9c8\uc9c0\ub9c9\uc73c\ub85c \ud655\uc778\ud55c \uc815\ubcf4\uc785\ub2c8\ub2e4. \ub2e4\uc2dc \uc5f0\uacb0\ub420 \ub54c\uae4c\uc9c0 \uc628\ub77c\uc778 \uacb0\uc81c\uac00 \uc911\uc9c0\ub429\ub2c8\ub2e4.', '<b>\u5e97\u8217\u30b7\u30b9\u30c6\u30e0\u306b\u63a5\u7d9a\u3067\u304d\u307e\u305b\u3093\u3002</b>{t} \u6642\u70b9\u3067\u78ba\u8a8d\u3057\u305f\u60c5\u5831\u3067\u3059\u3002\u518d\u63a5\u7d9a\u307e\u3067\u30aa\u30f3\u30e9\u30a4\u30f3\u6c7a\u6e08\u306f\u505c\u6b62\u3057\u307e\u3059\u3002'],
    'banner_rec': ['Reconnecting to the store. Payments resume once balances are re-verified.', 'Reconnexion au magasin. Les paiements reprennent apr\u00e8s v\u00e9rification des soldes.', '\ub9e4\uc7a5\uc5d0 \ub2e4\uc2dc \uc5f0\uacb0\ud558\ub294 \uc911\uc785\ub2c8\ub2e4. \uc794\uc561\uc744 \ub2e4\uc2dc \ud655\uc778\ud55c \ub4a4 \uacb0\uc81c\uac00 \uc7ac\uac1c\ub429\ub2c8\ub2e4.', '\u5e97\u8217\u306b\u518d\u63a5\u7d9a\u3057\u3066\u3044\u307e\u3059\u3002\u6b8b\u9ad8\u306e\u518d\u78ba\u8a8d\u5f8c\u306b\u6c7a\u6e08\u3092\u518d\u958b\u3057\u307e\u3059\u3002'],
    'pay_ticket': ['Pay ticket {id}', 'Payer le ticket {id}', '\uc8fc\ubb38 {id} \uacb0\uc81c', '\u6ce8\u6587 {id} \u306e\u652f\u6255\u3044'],
    'ticket_total': ['Ticket total', 'Total du ticket', '\uc8fc\ubb38 \ud569\uacc4', '\u6ce8\u6587\u5408\u8a08'],
    'already_paid': ['Already paid (deposits, payments)', 'D\u00e9j\u00e0 pay\u00e9 (acomptes, paiements)', '\uc774\ubbf8 \uacb0\uc81c\ud55c \uae08\uc561 (\uc120\uae08, \uacb0\uc81c)', '\u652f\u6255\u3044\u6e08\u307f (\u524d\u91d1\u30fb\u304a\u652f\u6255\u3044)'],
    'full_bal': ['Full balance', 'Solde complet', '\uc794\uc561 \uc804\uccb4', '\u6b8b\u9ad8\u5168\u984d'],
    'part': ['Part of it', 'Une partie', '\uc77c\ubd80\ub9cc \uacb0\uc81c', '\u4e00\u90e8\u3092\u652f\u6255\u3046'],
    'rest_later': ['pay the rest later', 'le reste plus tard', '\ub098\uba38\uc9c0\ub294 \ub098\uc911\uc5d0', '\u6b8b\u308a\u306f\u5f8c\u3067'],
    'amount_in': ['Amount in {c}', 'Montant en {c}', '\uae08\uc561 ({c})', '\u91d1\u984d ({c})'],
    'continue': ['Continue to secure payment', 'Continuer vers le paiement s\u00e9curis\u00e9', '\uc548\uc804\ud55c \uacb0\uc81c\ub85c \uacc4\uc18d', '\u5b89\u5168\u306a\u6c7a\u6e08\u753b\u9762\u3078\u9032\u3080'],
    'checking': ['Checking balance with the store...', 'V\u00e9rification du solde aupr\u00e8s du magasin...', '\ub9e4\uc7a5\uc5d0\uc11c \uc794\uc561 \ud655\uc778 \uc911...', '\u5e97\u8217\u3067\u6b8b\u9ad8\u3092\u78ba\u8a8d\u4e2d...'],
    'remaining_after': ['Remaining after this payment:', 'Reste apr\u00e8s ce paiement :', '\uc774\ubc88 \uacb0\uc81c \ud6c4 \ub0a8\ub294 \uae08\uc561:', '\u3053\u306e\u652f\u6255\u3044\u5f8c\u306e\u6b8b\u308a:'],
    'secure_pay': ['Secure payment', 'Paiement s\u00e9curis\u00e9', '\uc548\uc804\ud55c \uacb0\uc81c', '\u5b89\u5168\u306a\u6c7a\u6e08'],
    'cancel': ['Cancel', 'Annuler', '\ucde8\uc18c', '\u30ad\u30e3\u30f3\u30bb\u30eb'],
    'or_card': ['or pay by card', 'ou payer par carte', '\ub610\ub294 \uce74\ub4dc\ub85c \uacb0\uc81c', '\u307e\u305f\u306f\u30ab\u30fc\u30c9\u3067\u652f\u6255\u3046'],
    'card_note': ['Card details go straight to {p}. This app, our servers and the store\'s POS only receive a token and the result.', 'Les donn\u00e9es de carte vont directement \u00e0 {p}. L\'application, nos serveurs et la caisse du magasin ne re\u00e7oivent qu\'un jeton et le r\u00e9sultat.', '\uce74\ub4dc \uc815\ubcf4\ub294 {p}(\uc73c)\ub85c \ubc14\ub85c \uc804\uc1a1\ub429\ub2c8\ub2e4. \uc571, \uc11c\ubc84, \ub9e4\uc7a5 POS\ub294 \ud1a0\ud070\uacfc \uacb0\uacfc\ub9cc \ubc1b\uc2b5\ub2c8\ub2e4.', '\u30ab\u30fc\u30c9\u60c5\u5831\u306f {p} \u306b\u76f4\u63a5\u9001\u4fe1\u3055\u308c\u307e\u3059\u3002\u30a2\u30d7\u30ea\u3001\u30b5\u30fc\u30d0\u30fc\u3001\u5e97\u8217\u306e POS \u304c\u53d7\u3051\u53d6\u308b\u306e\u306f\u30c8\u30fc\u30af\u30f3\u3068\u7d50\u679c\u3060\u3051\u3067\u3059\u3002'],
    'wallet_off': ['Not available for this store yet', 'Pas encore disponible pour ce magasin', '\uc774 \ub9e4\uc7a5\uc5d0\uc11c\ub294 \uc544\uc9c1 \uc0ac\uc6a9\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4', '\u3053\u306e\u5e97\u8217\u3067\u306f\u307e\u3060\u3054\u5229\u7528\u3044\u305f\u3060\u3051\u307e\u305b\u3093'],
    'received': ['Payment received', 'Paiement re\u00e7u', '\uacb0\uc81c\uac00 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4', '\u304a\u652f\u6255\u3044\u3092\u53d7\u3051\u4ed8\u3051\u307e\u3057\u305f'],
    'done': ['Done', 'Termin\u00e9', '\uc644\ub8cc', '\u9589\u3058\u308b'],
    'processing': ['Processing {a}', 'Traitement de {a}', '{a} \ucc98\ub9ac \uc911', '{a} \u3092\u51e6\u7406\u4e2d'],
    'store_update': ['Store update', 'Mise \u00e0 jour du magasin', '\ub9e4\uc7a5 \ubc18\uc601', '\u5e97\u8217\u3078\u306e\u53cd\u6620'],
    'posted': ['Posted', 'Enregistr\u00e9', '\ubc18\uc601\ub428', '\u53cd\u6620\u6e08\u307f'],
    'pending': ['Pending', 'En attente', '\ub300\uae30 \uc911', '\u51e6\u7406\u5f85\u3061'],
    'remaining_bal': ['Remaining balance', 'Solde restant', '\ub0a8\uc740 \uc794\uc561', '\u6b8b\u9ad8'],
    'lang': ['Language', 'Langue', '\uc5b8\uc5b4', '\u8a00\u8a9e'],
    'store': ['Store', 'Magasin', '\ub9e4\uc7a5', '\u5e97\u8217'],
    'claim_cta': ['Have a paper receipt? Claim a ticket', 'Un re\u00e7u papier ? Ajoutez le ticket', '\uc885\uc774 \uc601\uc218\uc99d\uc774 \uc788\ub098\uc694? \uc8fc\ubb38 \ucd94\uac00\ud558\uae30', '\u7d19\u306e\u30ec\u30b7\u30fc\u30c8\u3092\u304a\u6301\u3061\u3067\u3059\u304b\uff1f\u6ce8\u6587\u3092\u8ffd\u52a0'],
    'claim_title': ['Claim a ticket', 'Ajouter un ticket', '\uc601\uc218\uc99d\uc73c\ub85c \uc8fc\ubb38 \ucd94\uac00', '\u30ec\u30b7\u30fc\u30c8\u304b\u3089\u6ce8\u6587\u3092\u8ffd\u52a0'],
    'claim_hint': ['Enter the code printed on your receipt. It links that one ticket to your account.', 'Saisissez le code imprim\u00e9 sur votre re\u00e7u. Il ajoute ce seul ticket \u00e0 votre compte.', '\uc601\uc218\uc99d\uc5d0 \uc778\uc1c4\ub41c \ucf54\ub4dc\ub97c \uc785\ub825\ud558\uc138\uc694. \ud574\ub2f9 \uc8fc\ubb38 \ud558\ub098\ub9cc \uacc4\uc815\uc5d0 \uc5f0\uacb0\ub429\ub2c8\ub2e4.', '\u30ec\u30b7\u30fc\u30c8\u306b\u5370\u5237\u3055\u308c\u305f\u30b3\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u305d\u306e\u6ce8\u6587\u3060\u3051\u304c\u30a2\u30ab\u30a6\u30f3\u30c8\u306b\u8ffd\u52a0\u3055\u308c\u307e\u3059\u3002'],
    'claim_label': ['Code on the receipt', 'Code du re\u00e7u', '\uc601\uc218\uc99d \ucf54\ub4dc', '\u30ec\u30b7\u30fc\u30c8\u306e\u30b3\u30fc\u30c9'],
    'claim_btn': ['Claim ticket', 'Ajouter', '\ucd94\uac00', '\u8ffd\u52a0\u3059\u308b'],
    'claim_bad': ['That code is not valid. Check the receipt and try again. {n} tries left.', 'Ce code n\'est pas valide. V\u00e9rifiez le re\u00e7u et r\u00e9essayez. Encore {n} essais.', '\uc720\ud6a8\ud558\uc9c0 \uc54a\uc740 \ucf54\ub4dc\uc785\ub2c8\ub2e4. \uc601\uc218\uc99d\uc744 \ud655\uc778\ud558\uace0 \ub2e4\uc2dc \uc2dc\ub3c4\ud558\uc138\uc694. \ub0a8\uc740 \uc2dc\ub3c4 {n}\ud68c.', '\u3053\u306e\u30b3\u30fc\u30c9\u306f\u7121\u52b9\u3067\u3059\u3002\u30ec\u30b7\u30fc\u30c8\u3092\u78ba\u8a8d\u3057\u3066\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044\u3002\u6b8b\u308a {n} \u56de\u3002'],
    'claim_exp': ['This code has expired. Ask the store to reprint your receipt.', 'Ce code a expir\u00e9. Demandez au magasin de r\u00e9imprimer le re\u00e7u.', '\ub9cc\ub8cc\ub41c \ucf54\ub4dc\uc785\ub2c8\ub2e4. \ub9e4\uc7a5\uc5d0 \uc601\uc218\uc99d \uc7ac\ubc1c\ud589\uc744 \uc694\uccad\ud558\uc138\uc694.', '\u3053\u306e\u30b3\u30fc\u30c9\u306f\u671f\u9650\u5207\u308c\u3067\u3059\u3002\u5e97\u8217\u3067\u30ec\u30b7\u30fc\u30c8\u3092\u518d\u767a\u884c\u3057\u3066\u3082\u3089\u3063\u3066\u304f\u3060\u3055\u3044\u3002'],
    'claim_used': ['This code was already used.', 'Ce code a d\u00e9j\u00e0 \u00e9t\u00e9 utilis\u00e9.', '\uc774\ubbf8 \uc0ac\uc6a9\ub41c \ucf54\ub4dc\uc785\ub2c8\ub2e4.', '\u3053\u306e\u30b3\u30fc\u30c9\u306f\u3059\u3067\u306b\u4f7f\u7528\u3055\u308c\u3066\u3044\u307e\u3059\u3002'],
    'claim_lock': ['Too many tries. Wait 15 minutes or ask the store for help.', 'Trop d\'essais. Attendez 15 minutes ou demandez au magasin.', '\uc2dc\ub3c4 \ud69f\uc218\ub97c \ucd08\uacfc\ud588\uc2b5\ub2c8\ub2e4. 15\ubd84 \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud558\uac70\ub098 \ub9e4\uc7a5\uc5d0 \ubb38\uc758\ud558\uc138\uc694.', '\u8a66\u884c\u56de\u6570\u304c\u591a\u3059\u304e\u307e\u3059\u300215\u5206\u5f85\u3064\u304b\u3001\u5e97\u8217\u306b\u304a\u554f\u3044\u5408\u308f\u305b\u304f\u3060\u3055\u3044\u3002'],
    'claim_ok': ['Ticket {id} added. Only this ticket is linked. To see your full history at this store, verify your phone number or ask the counter.', 'Ticket {id} ajout\u00e9. Seul ce ticket est li\u00e9. Pour voir tout votre historique, v\u00e9rifiez votre num\u00e9ro ou demandez au comptoir.', '\uc8fc\ubb38 {id}\uc774(\uac00) \ucd94\uac00\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \uc774 \uc8fc\ubb38\ub9cc \uc5f0\uacb0\ub429\ub2c8\ub2e4. \uc804\uccb4 \ub0b4\uc5ed\uc744 \ubcf4\ub824\uba74 \uc804\ud654\ubc88\ud638\ub97c \uc778\uc99d\ud558\uac70\ub098 \uce74\uc6b4\ud130\uc5d0 \ubb38\uc758\ud558\uc138\uc694.', '\u6ce8\u6587 {id} \u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f\u3002\u30ea\u30f3\u30af\u3055\u308c\u308b\u306e\u306f\u3053\u306e\u6ce8\u6587\u3060\u3051\u3067\u3059\u3002\u3059\u3079\u3066\u306e\u5c65\u6b74\u3092\u898b\u308b\u306b\u306f\u96fb\u8a71\u756a\u53f7\u3092\u78ba\u8a8d\u3059\u308b\u304b\u3001\u5e97\u982d\u3067\u304a\u5c0b\u306d\u304f\u3060\u3055\u3044\u3002'],
    'claimed_note': ['Added with a receipt code', 'Ajout\u00e9 avec un code de re\u00e7u', '\uc601\uc218\uc99d \ucf54\ub4dc\ub85c \ucd94\uac00\ub428', '\u30ec\u30b7\u30fc\u30c8\u306e\u30b3\u30fc\u30c9\u3067\u8ffd\u52a0'],
    'tip_title': ['Tip your driver', 'Pourboire pour le livreur', '\ubc30\ub2ec \uae30\uc0ac\ub2d8\uaed8 \ud301', '\u30c9\u30e9\u30a4\u30d0\u30fc\u3078\u306e\u30c1\u30c3\u30d7'],
    'tip_note': ['Optional. Charged as a separate payment on {p} in {c}. Your ticket does not change.', 'Facultatif. D\u00e9bit\u00e9 s\u00e9par\u00e9ment via {p} en {c}. Votre ticket ne change pas.', '\uc120\ud0dd \uc0ac\ud56d\uc785\ub2c8\ub2e4. {p}\uc5d0\uc11c {c}(\uc73c)\ub85c \ubcc4\ub3c4 \uacb0\uc81c\ub418\uba70 \uc8fc\ubb38 \uae08\uc561\uc740 \ubc14\ub00c\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.', '\u4efb\u610f\u3067\u3059\u3002{p} \u3067 {c} \u306e\u5225\u306e\u652f\u6255\u3044\u3068\u3057\u3066\u8acb\u6c42\u3055\u308c\u307e\u3059\u3002\u6ce8\u6587\u306e\u91d1\u984d\u306f\u5909\u308f\u308a\u307e\u305b\u3093\u3002'],
    'tip_sent': ['Tip of {a} sent. Thank you!', 'Pourboire de {a} envoy\u00e9. Merci !', '{a} \ud301\uc744 \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4. \uac10\uc0ac\ud569\ub2c8\ub2e4!', '{a} \u306e\u30c1\u30c3\u30d7\u3092\u9001\u308a\u307e\u3057\u305f\u3002\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\uff01'],
  };
  const SVC = {
    'suit.2pc': ['Suit, 2-piece', 'Costume 2 pi\u00e8ces', '\uc815\uc7a5 2\ud53c\uc2a4', '\u30b9\u30fc\u30c4\u4e0a\u4e0b'],
    'shirt.press': ['Shirt, laundered + pressed', 'Chemise lav\u00e9e et repass\u00e9e', '\uc154\uce20 \uc138\ud0c1 \ubc0f \ub2e4\ub9bc\uc9c8', '\u30ef\u30a4\u30b7\u30e3\u30c4 (\u6d17\u3044\u30fb\u30d7\u30ec\u30b9)'],
    'dress.silk': ['Dress, silk', 'Robe en soie', '\uc2e4\ud06c \uc6d0\ud53c\uc2a4', '\u30b7\u30eb\u30af\u306e\u30ef\u30f3\u30d4\u30fc\u30b9'],
    'coat.wool': ['Overcoat, wool', 'Manteau en laine', '\uc6b8 \ucf54\ud2b8', '\u30a6\u30fc\u30eb\u306e\u30b3\u30fc\u30c8'],
    'comforter': ['Comforter, king', 'Couette king size', '\ud0b9\uc0ac\uc774\uc988 \uc774\ubd88', '\u639b\u3051\u5e03\u56e3 (\u30ad\u30f3\u30b0)'],
  };
  const IX = { en: 0, fr: 1, ko: 2, ja: 3 };
  D.t = (lang, k, v) => { const row = S[k]; let s = row ? row[IX[lang] || 0] || row[0] : k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
  D.tKeys = () => Object.keys(S);
  D.svcName = (code, lang) => { const r = SVC[code]; return r ? r[IX[lang] || 0] : code; };
  D.svcEn = (code) => (SVC[code] ? SVC[code][0] : code);
  D.locale = (lang) => (D.LANGS.find((x) => x[0] === lang) || D.LANGS[0])[2];
  /* money in minor units */
  D.DEC = { USD: 2, CAD: 2, EUR: 2, KRW: 0, JPY: 0 };
  D.fmt = (minor, cur, lang) => { const d = D.DEC[cur] ?? 2; try { return new Intl.NumberFormat(D.locale(lang || 'en'), { style: 'currency', currency: cur, minimumFractionDigits: d, maximumFractionDigits: d }).format(minor / Math.pow(10, d)); } catch (e) { return (minor / Math.pow(10, d)).toFixed(d) + ' ' + cur; } };
  D.toMinor = (txt, cur) => { const d = D.DEC[cur] ?? 2, n = parseFloat(String(txt || '0').replace(',', '.')); if (!(n > 0)) return 0; const x = n * Math.pow(10, d), m = Math.round(x); return Math.abs(x - m) > 1e-6 ? -1 : m; };
  D.provFor = (country) => (['US', 'CA'].includes(country) ? 'Authorize.Net' : 'CyberSource');
})();
