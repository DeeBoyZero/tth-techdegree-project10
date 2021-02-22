import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const CourseDetail = () => {

  const { id } = useParams()

  const [course, setCourse] = useState([]);

  const getCourseDetail = () => {
      return fetch(`http://localhost:5000/api/courses/${id}`)
        .then(res => res.json())
        .then(data => setCourse(data))
        .catch(err => {
          console.error(err);
        })
  }

  const deleteCourse = async () => {
    await fetch(`http://localhost:5000/api/courses/${id}`, {
      method: 'DELETE',
    })
      .catch(err => {
        console.error(err);
      })
  }

  useEffect(() => {
    getCourseDetail();
  }, [])

  return (
    
    <div>
        <div className="actions--bar">
          <div className="bounds">
            <div className="grid-100"><span><Link className="button" to={`/courses/${id}/update`}>Update Course</Link><Link className="button" onClick={deleteCourse} to="#">Delete Course</Link></span><Link
                className="button button-secondary" to="/">Return to List</Link></div>
          </div>
        </div>
        <div className="bounds course--detail">
          <div className="grid-66">
            <div className="course--header">
              <h4 className="course--label">Course</h4>
              <h3 className="course--title">{course.title}</h3>
              {course.User ? <p>By {course.User.firstName} {course.User.lastName}</p> : <p></p>}
            </div>
            <div className="course--description">
              <p>{course.description}</p>
            </div>
          </div>
          <div className="grid-25 grid-right">
            <div className="course--stats">
              <ul className="course--stats--list">
                <li className="course--stats--list--item">
                  <h4>Estimated Time</h4>
                  {course.estimatedTime ? <h3>{course.estimatedTime}</h3> : null}                 
                </li>
                <li className="course--stats--list--item">
                  <h4>Materials Needed</h4>
                  {course.materialNeeded ? 
                    <ul>

                    </ul>
                    :
                    null
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  )
}

export default CourseDetail;