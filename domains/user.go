package domains

import (
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        int
	Username  string
	Password  string
	Email     string
	CreatedAt time.Time
	LastLogin time.Time
}

func (u *User) IsPasswordValid(plain string) bool {
	if utf8.RuneCountInString(plain) <= 8 {
		return false
	}
	return true
}

//	func (u *User) IsPasswordMatch(plain string) bool {
//		if plain != u.Password {
//			return false
//		}
//		return true
//	}
func (u *User) IsPasswordMatch(plain string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(plain))
	return err == nil
}
