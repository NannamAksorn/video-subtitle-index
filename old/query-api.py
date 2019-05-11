from flask import Flask,request, jsonify
from flask_restful import Resource, Api
from flask_cors import CORS, cross_origin
import os
import glob
import json
import math
import re
from nltk.stem import PorterStemmer 
from nltk.tokenize import word_tokenize

app = Flask(__name__)
CORS(app)

inverted_lists = {}
docId = {}
ps = PorterStemmer()

with open('docId', 'r', encoding="utf8") as f:
    docId = json.load(f)
    print("loaded DocID")
with open('inverted_index', 'r', encoding="utf8") as f:
    inverted_lists = json.load(f)
    print("loaded inverted Index")
idDoc = list(docId)

def cleanhtml(raw_html):
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext

def zipper(listA, listB):
    i = 0
    j = 0
    resultDoc = []
    while i < len(listA) and j < len(listB):
        if listA[i] == listB[j]:
            resultDoc.append(listA[i])
            i += 1
            j += 1
        elif listA[i] > listB[j]:
            j += 1
        else:
            i += 1
    return resultDoc

def merge_inverted_lists(queryA, queryB):    
    listA = inverted_lists[queryA]
    listA = list(listA.keys())
    listB = inverted_lists[queryB]
    listB = list(listB.keys())
    
    return zipper(listA, listB)

def query_doc(query_string):
    returnDoc = []

    query_list = word_tokenize(query_string)
    query_list = [ps.stem(word) for word in query_list]
    
    query_list = [q for q in query_list if inverted_lists.get(q)]
    if len(query_list) >= 1:
        listA = inverted_lists[query_list[0]]
        listA = list(listA.keys())
        returnDoc = listA

    if len(query_list) >= 2:
        listB = inverted_lists[query_list[1]]
        listB = list(listB.keys())
        returnDoc = zipper(listA, listB)

    if len(query_list) >=3:
        for query in query_list[2:]:
            listC = inverted_lists[query]
            listC = list(listC.keys())
            returnDoc = zipper(returnDoc, listC)

    returnDoc_score = []
    for doc in returnDoc:
        returnDoc_score.append([doc,0])
        for query in query_list:
            returnDoc_score[-1][1] += inverted_lists[query][doc][0] 
    returnDoc_score.sort(key= lambda x: x[1], reverse=True)
    return returnDoc_score

def getPosting(query_string, docId):
    WORD_PER_PASSAGE = 10
    result_docs = []
    result_rank = {}
    result_list_rank = []
    
    doc_count =  0
    for word in word_tokenize(query_string):
        word = ps.stem(word)
        if (inverted_lists.get(word)):
            result_docs.append([rid//WORD_PER_PASSAGE for rid in inverted_lists[word][docId][3:]])
    for doc in result_docs:
        doc_count += len(doc)
    for docs in result_docs:
        idf = math.log(doc_count/len(docs))
        for doc in docs:
            if not result_rank.get(doc):
                result_rank[doc] = idf
            else:
                result_rank[doc] += idf
    for item in result_rank:
        result_list_rank.append((item*WORD_PER_PASSAGE, result_rank[item]))
    result_list_rank.sort(key=lambda x: x[1], reverse=True)
    return result_list_rank[:3]

def get_sec(time_str):
    h, m, s = time_str.split(':')
    return int(h) * 3600 + int(m) * 60 + int(s)

def get_range(srt_path, query):
    with open (srt_path, 'r', encoding="utf8") as f:
        content = f.readlines()
        content = [x.strip() for x in content]
    num ={}
    for i,ele in enumerate(content):
        if ele.isdigit()== True:
            second = get_sec(content[i+1][0:8])
            sub = cleanhtml(content[i+2])
            num[int(ele)] = (second, sub)
    summery = ""
    if num.get(query):
        for i in range(9):
            if num.get(query + i):
                summery = summery + " " + num[query + i][1]
        return (num[query][0], summery)
    else:
        for i in range(9):
            if num.get(1 + i):
                summery = summery + " " + num[query + i][1]
        return (0, summery)


def query(query_string):
    res = []
    for key,doc in enumerate(query_doc(query_string)):
        docName = idDoc[int(doc[0]) - 1]
        vidName = docName.replace(".transcribed", "") + ".mp4"
        tmp = {"name":vidName, "key":key, "pos":[]}
        posting = getPosting(query_string, doc[0])
        for srtId in posting:
            tmp["pos"].append(get_range('srt/{}.srt'.format(docName), srtId[0] + 1))
        res.append(tmp)
    return res


@app.route('/search', methods=['POST'])
# @cross_origin(supports_credentials=True)
def search():
    if not request.json or not 'query' in request.json:
        abort(400)
    

    return jsonify(query(request.json['query'])), 201

app.run( port=5000,debug=True)