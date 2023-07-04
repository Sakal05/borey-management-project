// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// for comment section
import Divider from '@mui/material/Divider'
import Collapse from '@mui/material/Collapse'

import { useState, useEffect } from 'react'

// ** Image Module Import MUI
import ImageList from '@mui/material/ImageList'
import ImageListItem from '@mui/material/ImageListItem'
import Send from '@mui/icons-material/Send'
// ** Icons Imports
import Heart from 'mdi-material-ui/Heart'
import HeartOutline from 'mdi-material-ui/HeartOutline'
import ShareVariant from 'mdi-material-ui/ShareVariant'
import CommentSection from 'src/views/commentSection'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/router'
import TextField from '@mui/material/TextField'
import Comment from 'mdi-material-ui/Comment'

const NewsFeedCard = props => {
  const { data } = props
  const [cardData, setCardData] = useState(data)
  const { user_id } = props
  console.log('user_id', user_id)
  const [collapse, setCollapse] = useState(false)
  const [viewAllImages, setViewAllImages] = useState(false)
  const [comment, setComment] = useState('')
  const [likeClicked, setLikeClicked] = useState(false)
  const token = localStorage.getItem('token')
  console.log('Each data for newsfeed card', cardData)
  const handleClick = () => {
    setCollapse(!collapse)
  }

  const handleChangeComment = e => {
    setComment(e.target.value)
  }

  const handleDeletePost = async () => {
    console.log('Id delete post: ', cardData.id)
    try {
      const res = await axios({
        url: `http://localhost:8000/api/posts/${cardData.id}`,
        method: 'delete',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      console.log(res)
      unPinnedPostedPhoto()
      toast.success('Delete successfully')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddComment = async () => {
    /* 
        'post_id' => 'required|exists:posts,id',
        'content' => 'required',
      */
    try {
      const res = await axios({
        url: `http://localhost:8000/api/postcomment`,
        method: 'POST',
        data: {
          post_id: cardData.id,
          content: comment
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      console.log(res)
      setComment('')
      toast.success('Comment added successfully')
    } catch (err) {
      console.error(err)
    }
  }

  const unPinnedPostedPhoto = () => {
    const images = cardData.image.split(',')
    images.forEach(async item => {
      try {
        const res = await axios({
          method: 'delete',
          url: `https://api.pinata.cloud/pinning/unpin/${item}`,
          headers: {
            Authorization: `Bearer ${process.env.JWT}`
          }
        })
        console.log(res)
        toast.success('Image removed successfully')
      } catch (e) {
        toast.error('Failed to remove image')
        console.error(e)
      }
    })
  }

  const toggleViewAllImages = () => {
    setViewAllImages(!viewAllImages)
  }

  const handleLikeClick = async () => {
    if (!likeClicked) {
      try {
        const res = await axios({
          url: `http://localhost:8000/api/postlike`,
          method: 'POST',
          data: {
            post_id: cardData.id
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        console.log(res)
        const likes = [...cardData.likes]
        const likeField = {
          user_id: user_id,
          post_id: cardData.id
        }
        likes.push(likeField)
        setCardData(prevState => ({
          ...prevState,
          likes: likes
        }))
        setLikeClicked(true)
        toast.success('Like successfully')
      } catch (err) {
        console.error(err)
      }
    } else {
      try {
        const res = await axios({
          url: `http://localhost:8000/api/postlike`,
          method: 'delete',
          data: {
            post_id: cardData.id
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        console.log(res)
        console.log("Before likes update: ",cardData.likes)
        const updatedLikes = cardData.likes.filter(like => like.user_id !== user_id)
        console.log("After likes update: ",updatedLikes)

        setCardData(prevState => ({
          ...prevState,
          likes: updatedLikes
        }))
        setLikeClicked(false)
        toast.success('Dislike successfully')
      } catch (err) {
        console.error(err)
      }
    }
  }

  const getImageItems = () => {
    let images = cardData.image.split(',').slice(0, 4) // Display only 4 images initially

    if (viewAllImages) {
      images = cardData.image.split(',') // Display all images if 'viewAllImages' is true
    }

    const imageItems = []

    images.forEach((item, index) => {
      imageItems.push(
        <ImageListItem key={index}>
          <img
            src={`https://gateway.ipfs.io/ipfs/${item}`}
            loading='lazy'
            alt={`Image ${index + 1}`}
            style={{ height: 100, width: 'auto' }} // Adjust the height based on 'viewAllImages' state
          />
        </ImageListItem>
      )
    })

    return imageItems
  }

  useEffect(() => {
    setCardData(cardData)
    console.log(user_id)
    const userLikePost = cardData.likes.filter(like => like.user_id === user_id)
    console.log(userLikePost)
    if (userLikePost.length > 0) {
      setLikeClicked(true)
    }
  }, [user_id])
  //src='/images/avatars/4.png'
  return (
    <Card sx={{ border: 0, boxShadow: 0, color: 'common.white', backgroundColor: 'info.main' }}>
      <CardContent sx={{ padding: theme => `${theme.spacing(3.25, 5, 4.5)} !important` }}>
        <Typography
          variant='h6'
          sx={{ display: 'flex', marginBottom: 2.75, alignItems: 'center', color: 'common.white' }}
        >
          <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar
              alt={cardData.user_id ? cardData.user.fullname : cardData.company_id}
              src={
                cardData.user_info
                  ? `https://gateway.ipfs.io/ipfs/${cardData.user_info.image_cid}`
                  : '/images/avatars/4.png'
              }
              sx={{ width: 34, height: 34, marginRight: 2.75 }}
            />
            <Typography variant='body2' sx={{ color: 'common.white' }}>
              {cardData.user_id !== null ? cardData.user.fullname : cardData.company_id}
            </Typography>
            {user_id === cardData.user_id ? (
              <Tooltip title='Delete'>
                <IconButton onClick={() => handleDeletePost()}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Box></Box>
            )}
          </Box>
        </Typography>
        <Typography variant='h3' sx={{ marginBottom: 3, color: 'common.white', textAlign: 'left' }}>
          {cardData.heading}
        </Typography>
        <Typography variant='body2' sx={{ marginBottom: 3, color: 'common.white', textAlign: 'left' }}>
          {cardData.description}
        </Typography>
        <ImageList sx={{ width: '100%', height: 450 }} cols={2} rowHeight={164}>
          {getImageItems()}
        </ImageList>
        {!viewAllImages && getImageItems().length > 4 && (
          <Button onClick={toggleViewAllImages} sx={{ color: 'common.white' }}>
            View More
          </Button>
        )}
        {viewAllImages && (
          <Button onClick={toggleViewAllImages} sx={{ color: 'common.white' }}>
            View Less
          </Button>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 0 }} onClick={() => handleLikeClick()}>
              {likeClicked ? <Heart sx={{ marginRight: 1.25 }} /> : <HeartOutline sx={{ marginRight: 1.25 }} />}

              <Typography variant='body2' sx={{ color: 'common.white' }}>
                {cardData.likes.length}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button onClick={handleClick} sx={{ color: 'common.white' }}>
                <Comment/>
              </Button>
              <Typography variant='body2' sx={{ color: 'common.white' }}>
                {cardData.comments.length}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Collapse in={collapse} sx={{ textAlign: 'left' }}>
          <Divider sx={{ margin: 0 }} />
          <Box display={'flex'}>
            <TextField
              fullWidth
              label='Leave your comment here'
              name='comment'
              value={comment}
              onChange={handleChangeComment}
              onBlur={handleChangeComment}
              marginRight={3}
              InputLabelProps={{
                sx: { color: 'white' } // Set the label text color to white
              }}
            />
            <IconButton sx={{ color: 'white' }} onClick={() => handleAddComment()}>
              <Send />
            </IconButton>
          </Box>
          {cardData.comments.length !== 0 ? (
            cardData.comments.map(cmt => (
              <CardContent key={cmt.id}>
                <CommentSection cmt={cmt}></CommentSection>
              </CardContent>
            ))
          ) : (
            <Box>
              <Typography
                variant='body2'
                sx={{ display: 'flex', marginBottom: 2.75, alignItems: 'center', color: 'common.white' }}
              >
                No comments available
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default NewsFeedCard
