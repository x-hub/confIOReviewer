import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import template from './sync.template';
import { removeActivity, saveActivities, setTalksListValue, TALK_LIST_TYPE } from 'app/App/Services/EventService'
import _ from 'lodash'

export const actions = {
    REMOVE_ACTION: 'REMOVE_ACTION',
    SYNC_ACTIONS: 'SYNC_ACTIONS',
    REMOVE_RESPONSE_ANIMATION:'REMOVE_RESPONSE_ANIMATION',
    RESET: 'RESET',
};

const actionCreators = {
    removeAction,
    syncActions,
    removeResponseAnimation,
    resetSync,
};

function resetSync() {
    return {
        type: actions.RESET,
        payload: {
            actionsDirty: false,
        },
    }
}

function removeAction(event, action) {
    const payload = removeActivity(event.code, action)
    return {
        type: actions.REMOVE_ACTION,
        payload: payload,
    }
}

function removeResponseAnimation() {
    const payload = new Promise(
        (resolve, reject) => {
            setTimeout(
                () => {
                    resolve({
                        syncSuccess: false,
                    })
                }
                , 3500
            )
        }
    )
    return {
        type: actions.REMOVE_RESPONSE_ANIMATION,
        payload: payload,
    }
}

function syncActions({ code, baseUrl }, actionsToSync, callback) {
    const votes = _.map(actionsToSync, ({ target, score }) => ({ proposal: target, vote: score}))
    const payload = fetch(
        baseUrl.concat('cfpadmin/proposals/sync'),
        { method: 'POST', body: JSON.stringify({ votes: votes }), headers: new Headers({ 'Content-Type': 'application/json' }) }
    )
    .then(r => r.json())
    .then(
        ({ talks, reviewedTalks }) => Promise.all([
                saveActivities(code, []),
                setTalksListValue(code, TALK_LIST_TYPE.TALKS, talks),
                setTalksListValue(code, TALK_LIST_TYPE.REVIEWED_TALKS, reviewedTalks),
        ])
    )
    .then(
        () => ({
            actions: [],
            syncError: true,
        })
    )
    .catch(
        err => ({
            actions: actionsToSync,
            syncError: true,
        })
    )

    payload.then(callback)
    return {
        type: actions.SYNC_ACTIONS,
        payload: payload,
    };
}

function mapStateToProps(state) {
    return state.sync;
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(actionCreators, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(template);
