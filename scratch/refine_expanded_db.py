import re
import json
import sys

filepath = r"c:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian\js\db_expanded.js"
reportpath = r"c:\Users\Itayu-PC\OneDrive\שולחן העבודה\Antigravity\VocRussian\scratch\refine_report.txt"

with open(filepath, "r", encoding="utf-8") as f:
    text = f.read()

# Locate the array
start_idx = text.find("[")
end_idx = text.rfind("]")

array_str = text[start_idx:end_idx+1]
data = json.loads(array_str)

pronouns_en = {'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'who', 'what', 'someone', 'something', 'nobody', 'nothing', 'all', 'every', 'each', 'myself', 'himself', 'herself', 'me', 'him', 'us', 'them'}
pronouns_ru = {'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'мой', 'твой', 'его', 'ее', 'её', 'наш', 'ваш', 'их', 'это', 'тот', 'этот', 'себя', 'кто', 'что', 'кто-то', 'что-то', 'никто', 'ничто', 'весь', 'каждый', 'сам', 'самый'}
prepositions_en = {'in', 'on', 'at', 'under', 'over', 'between', 'through', 'with', 'without', 'about', 'for', 'to', 'from', 'of', 'by', 'near', 'with', 'without', 'during'}
prepositions_ru = {'в', 'на', 'у', 'к', 'с', 'о', 'об', 'обо', 'за', 'под', 'над', 'перед', 'при', 'после', 'для', 'без', 'до', 'от', 'из', 'через', 'сквозь', 'между', 'около', 'возле', 'вокруг', 'против', 'перед', 'около'}
conjunctions_en = {'and', 'but', 'or', 'if', 'because', 'although', 'while', 'that'}
conjunctions_ru = {'и', 'а', 'но', 'или', 'да', 'что', 'чтобы', 'если', 'потому что', 'так как', 'хотя', 'когда', 'как'}
adverb_words = {'slowly', 'fast', 'well', 'very', 'often', 'always', 'never', 'here', 'there', 'where', 'when', 'yesterday', 'today', 'tomorrow', 'now', 'then', 'already', 'still', 'yet', 'much', 'little', 'together', 'again', 'why', 'how', 'soon', 'late', 'early', 'often', 'perhaps', 'maybe', 'almost', 'just', 'only', 'too', 'enough', 'rather'}

verb_endings = ('ть', 'ться', 'ти', 'тись', 'чь', 'чься')
adj_masc_fem = ('ый', 'ий', 'ой', 'ая', 'яя')

def classify_pos(word, translation, current_pos):
    w = word.strip().lower()
    t = translation.strip().lower()
    
    # Remove stress marks for suffix checks
    w_clean = w.replace('\u0301', '')

    # 1. Phrase
    if ' ' in w:
        return 'phrase'
        
    # 2. Pronoun
    if w_clean in pronouns_ru or t in pronouns_en:
        return 'pronoun'
        
    # 3. Preposition
    if w_clean in prepositions_ru or t in prepositions_en:
        return 'preposition'
        
    # 4. Conjunction
    if w_clean in conjunctions_ru or t in conjunctions_en:
        return 'conjunction'
        
    # 5. Verb
    if w_clean.endswith(verb_endings) or t.startswith('to ') or t.startswith('eat ') or t.startswith('drink ') or t.startswith('play ') or t.startswith('speak ') or t.startswith('learn ') or t.startswith('read ') or t.startswith('write '):
        return 'verb'
        
    # 6. Adjective
    if w_clean.endswith(adj_masc_fem):
        return 'adjective'
    if w_clean.endswith(('ое', 'ее', 'ые', 'ие')):
        if current_pos == 'adjective' and not w_clean.endswith(('ние', 'тие', 'ие', 'ье')):
            return 'adjective'
        if t in adverb_words or t.endswith('ly'):
            return 'adverb'
        if w_clean.endswith(('ние', 'тие', 'ие', 'ье')):
            return 'noun'
        
    # 7. Adverb
    if w_clean.endswith(('о', 'е')):
        if t.endswith('ly') or t in adverb_words or current_pos == 'adverb':
            return 'adverb'
            
    # 8. Numeral
    if t in {'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'first', 'second', 'third'} or re.match(r'^\d+$', w_clean):
        return 'numeral'
        
    # Default to noun if it was noun, or if it's a clear noun ending
    if w_clean.endswith(('ость', 'есть', 'ние', 'тие', 'ие', 'ство', 'тель', 'арь', 'ция', 'зия', 'гия', 'фия', 'ика', 'ка', 'та', 'ра', 'ма', 'ор', 'ер', 'тор', 'ент')):
        return 'noun'
        
    return current_pos

changes = []
for item in data:
    old_pos = item.get("pos")
    new_pos = classify_pos(item["word"], item["translation"], old_pos)
    if old_pos != new_pos:
        changes.append((item["id"], item["word"], item["translation"], old_pos, new_pos))
        item["pos"] = new_pos

# Write updated DB back
new_array_str = json.dumps(data, ensure_ascii=False, indent=2)
new_text = text[:start_idx] + new_array_str + text[end_idx+1:]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_text)

# Write report
with open(reportpath, "w", encoding="utf-8") as f:
    f.write(f"Total POS changes: {len(changes)}\n\n")
    for i, change in enumerate(changes):
        f.write(f"{change[0]}: {change[1]} ({change[2]}) | {change[3].upper()} -> {change[4].upper()}\n")

print(f"Successfully refined DB! Made {len(changes)} POS corrections. Report saved to refine_report.txt.")
