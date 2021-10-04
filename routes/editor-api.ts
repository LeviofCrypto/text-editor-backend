'use strict';
import * as dbFuns from '../src/db-functions.js';
import express from 'express';

const router = express.Router();

let dsn;

if (process.env.NODE_ENV === 'test') {
    dsn = '';
} else {
    dsn = `${process.env.DB_URI_PREFIX}://${process.env.DB_USERNAME}:` +
        `${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}` +
        '?retryWrites=true&w=majority';
}

const colName = 'editorDocs';

router.get('/document', async function(req, res) {
    const searchResult = await dbFuns.getAllDocsInCollection(dsn, colName);

    res.json(searchResult);
});

router.get('/document/:id', async function(req, res) {
    if ((typeof req.params.id === 'string') && (req.params.id.length === 24)) {
        const searchResult = await dbFuns.getSingleDocInCollection(dsn, colName, req.params.id);

        if (searchResult == null) {
            res.json({ error: 'matching_document_not_found' });
            return;
        }
        res.json(searchResult);
        return;
    }
    res.json({ error: 'invalid_id' });
});

router.put('/document/:id', async function(req, res) {
    if (!('title' in req.body)) {
        res.json({ error: 'missing_title' });
        return;
    }
    if (!('body' in req.body)) {
        res.json({ error: 'missing_body' });
        return;
    }
    const updatedDoc = {
        _id: req.params.id,
        title: req.body.title,
        body: req.body.body
    };
    const sendResult = await dbFuns.updateSingleDocInCollection(
        dsn,
        colName,
        updatedDoc
    );

    if (('acknowledged' in sendResult) && sendResult.acknowledged) {
        res.json(updatedDoc);
    } else {
        res.json(sendResult);
    }
});

router.post('/document', async function(req, res) {
    if (!('title' in req.body)) {
        res.json({ error: 'missing_title' });
        return;
    }
    if (!('body' in req.body)) {
        res.json({ error: 'missing_body' });
        return;
    }
    const newDoc = {
        title: req.body.title,
        body: req.body.body
    };
    const sendResult = await dbFuns.sendDocToCollection(dsn, colName, newDoc);

    if ('_id' in sendResult) {
        const returnDoc = {
            _id: sendResult._id,
            title: req.body.title,
            body: req.body.body
        };

        res.json(returnDoc);
    } else {
        res.json(sendResult);
    }
});

export const editorRouter = router;
