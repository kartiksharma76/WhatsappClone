package com.chatapp.repository;

import com.chatapp.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StatusRepository extends JpaRepository<Status, Long> {

    @Query("SELECT s FROM Status s WHERE s.expiresAt > :now AND " +
           "(s.user.id = :userId OR s.user.id IN (" +
           "  SELECT u2.id FROM Chat c JOIN c.participants u1 JOIN c.participants u2 " +
           "  WHERE u1.id = :userId" +
           ")) ORDER BY s.createdAt DESC")
    List<Status> findActiveStatusesForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("SELECT s FROM Status s WHERE s.expiresAt <= :now")
    List<Status> findExpiredStatuses(@Param("now") LocalDateTime now);
}
