var db = require('../../../backend/lib/mongoDB')

const upvote = (req, next) => {
    db.upvoteAnswer(req.upvote.answer_id).then(() =>{
        console.log("Upvote answer ", req.upvote.answer_id)
        db.getVotes(req.upvote.answer_id).then(result =>{
            console.log("Upvotes: ", result.upvote)
            console.log("Downvotes: ", result.downvote)
            next(null, {
                status: 200,
                data: {upvotes: result.upvote, downvote: result.downvote}
            })
        })
    })
}

const downvote = (req, next) => {
    db.downvoteAnswer(req.downvote.answer_id).then(() =>{
        console.log("Downvote answer ", req.downvote.answer_id)
        db.getVotes(req.downvote.answer_id).then(result =>{
            console.log("Upvotes: ", result.upvote)
            console.log("Downvotes: ", result.downvote)
            next(null, {
                status: 200,
                data: {upvotes: result.upvote, downvote: result.downvote}
            })
        })
    })
}

const allComments = (req, next) => {
    db.getComments(req.allComments.answer_id).then(result =>{
        console.log("allComments: ", result)
        next(null, {
            status: 200,
            data: result
        })
    })
}

const makeComment = (req, next) => {
    console.log("Answer ID: ", req.comment.answer_id)
    newComment = {
        answer_id: req.comment.answer_id,
        owner : req.comment.owner,
        time: new Date(),
        comment : req.comment.comment,
        anonymous: req.comment.anonymous
    }
    db.createComment(newComment).then(() =>{
        next(null, {
            status: 200,
            data: "New comment created under answer " + req.comment.answer_id
        })
    })
}

const makeAnswer = (req, next) => {
    console.log("question message: ", req)
    newAnswer ={
        question_id: req.answer.question_id,
        owner: req.answer.owner,
        time: new Date(),
        content: req.answer.content,
        upvote: 0,
        downvote: 0,
        anonymous: req.answer.anonymous,
        bookmark: [],
        comments: [],
    }
    console.log("newAnswer", newAnswer)
    db.createAnswer(newAnswer).then(result =>{
        db.updateUserWithAnswer(req.answer.owner, result)
        db.updateQuestionWithAnswer(req.answer.question_id, result)
        db.recordAnswer(req.answer.owner, result._id)
        next(null, {
            status: 200,
            data: "New Answer created"
        })
    })
}

const updateAnswer = (req, next) => {
    console.log("question ID: ", req.update)
    editInfo ={
        answer_id: req.update.answer_id,
        time: new Date(),
        content: req.update.content,
    }
    db.updateOneAnswer(editInfo).then(() =>{
        next(null, {
            status: 200,
            data: "Answer " + editInfo.answer_id + " updated..."
        })
    })
}

const createBookmark = (req, next) => {
    db.findOneAnswer(req.answerid).then(result =>{
        console.log("Answer content: ", result)
        
        db.setBookmark(req.userid, req.answerid)
        db.updateUserBookmark(req.userid, result)
        next(null, {
            status: 200,
            data: "Answer/User Schema: " + req.userid + " add bookmark on answer " + req.answerid
        })
    })
    console.log("Bookmark added")
}

const getOneAnswer = (req, next) => {
    db.findOneAnswer(req.OneAnswer.answer_id).then(result =>{
        console.log("Answer content: ", result)
        db.increaseView(result._id);
        next(null, {
            status: 200,
            data: result
        })
    })
}

const getOwnerOfAnswer = (req, next) => {
    db.getOwnerOfAnswer(req.answer.answer_id).then(result =>{
        console.log("Owner content: ", result)
        if(result.anonymous == false){
            next(null, {
                status: 200,
                data: {
                    user_id: result.owner._id,
                    name: result.owner.user_info.first_name +" "+ result.owner.user_info.last_name,
                    crediential: result.owner.user_info.profileCredential
                }
            })
        }
        next(null, {
            status: 200,
            data: {
                user_id: result.owner._id,
                name: "anonymous",
                crediential: result.owner.user_info.profileCredential
            }
        })
    })
}

const dispatch = (message, next) => {
    switch (message.cmd) {
        case 'UPVOTE':
            upvote(message, next);
            break;
        case 'DOWNVOTE':
            downvote(message, next);
            break;
        case 'ALL_COMMENTS':
            allComments(message, next);
            break;
        case 'MAKE_COMMENT':
            makeComment(message, next);
            break;
        case 'MAKE_ANSWER':
            makeAnswer(message, next);
            break;
        case 'UPDATE_ANSWER':
            updateAnswer(message, next);
            break;
        case 'CREATE_BOOKMARK':
            createBookmark(message, next);
            break;
        case 'GET_ONE_ANSWER':
            getOneAnswer(message, next);
            break;
        case 'GET_OWNER_OF_ANSWER':
            getOwnerOfAnswer(message, next);
            break;
        default:
            console.log('unknown request');
    }
}

module.exports = {dispatch}